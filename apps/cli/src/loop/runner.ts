/**
 * @fileoverview Main execution loop implementing the planner/worker architecture.
 *
 * This module orchestrates the Ferix execution flow:
 *
 * ```
 * User Task → BREAKDOWN → .ferix/PLAN.md created
 *                               │
 *                ┌──────────────┘
 *                ▼
 *           PLANNER → Updates PLAN.md with phases
 *                │
 *                ▼
 *           WORKER → Executes task, updates PLAN.md
 *                │
 *                ▼
 *           More tasks? ─── Yes ──→ Loop back to PLANNER
 *                │
 *                No
 *                ▼
 *           Complete
 * ```
 *
 * Key design principle: Each phase (breakdown, planner, worker) gets a
 * completely fresh LLM context. The `.ferix/PLAN.md` file serves as the
 * persistent memory between calls, solving the context window exhaustion
 * problem in long-running tasks.
 *
 * Supports two modes:
 * - **Dev mode**: Full-screen TUI with real-time progress tracking
 * - **Standard mode**: Simple logging for CI/piped environments
 *
 * @see ../prompt/breakdown.ts for the breakdown prompt
 * @see ../prompt/planner.ts for the planner prompt
 * @see ../prompt/worker.ts for the worker prompt
 * @see ../plan/utils.ts for plan file operations
 */

import { MESSAGES } from "../constants.js";
import type { ClaudeEvent, Engine } from "../engine/index.js";
import { getEngine } from "../engine/index.js";
import {
  createBranch,
  createPullRequest,
  getCurrentBranch,
  pushBranch,
} from "../git/index.js";
import {
  archivePlan,
  getNextTask,
  loadPlan,
  loadPlanIfExists,
} from "../plan/index.js";
import { createBreakdownPrompt } from "../prompt/breakdown.js";
import { createPlannerPrompt } from "../prompt/planner.js";
import { createWorkerPrompt } from "../prompt/worker.js";
import { colors } from "../tui/ansi.js";
import { DevMode } from "../tui/dev-mode.js";
import type { Criterion, Phase, StageStatus, Task } from "../types/config.js";
import {
  AgentError,
  DependencyError,
  ExecutionError,
} from "../types/errors.js";
import type { Plan, PlanTask, WorkerResult } from "../types/plan.js";
import type { ExecuteResult, FerixConfig } from "../types.js";
import { logger } from "../utils/logger.js";
import { initProgress } from "./progress.js";
import { runVerifyCommands } from "./verify.js";

/** Maximum number of check attempts before marking task as failed */
const MAX_CHECK_ATTEMPTS = 5;

/** Maximum number of verify retry attempts before failing */
const MAX_VERIFY_ATTEMPTS = 3;

/** Maximum number of review attempts before giving up on code quality pass */
const MAX_REVIEW_ATTEMPTS = 3;

/**
 * Sets up a new git branch if configured.
 *
 * Stores the original branch in config.baseBranch for PR creation later.
 *
 * @param config - Ferix configuration (may be mutated to set baseBranch)
 * @returns The original base branch name, or undefined if no branch configured
 */
async function setupGitBranch(
  config: FerixConfig
): Promise<string | undefined> {
  if (!config.branch) {
    return undefined;
  }

  const baseBranch = await getCurrentBranch();
  await createBranch(config.branch);
  config.baseBranch = baseBranch;
  return baseBranch;
}

/**
 * Handles post-completion git operations (push and PR creation).
 *
 * @param config - Ferix configuration with branch/push/pr settings
 * @returns Result indicating if push occurred and optional PR URL
 */
async function handlePostLoop(
  config: FerixConfig
): Promise<{ pushed: boolean; prUrl?: string }> {
  if (!(config.push && config.branch)) {
    return { pushed: false };
  }

  await pushBranch(config.branch);

  let prUrl: string | undefined;
  if (config.pr && config.baseBranch) {
    const result = await createPullRequest(config.baseBranch);
    prUrl = result ?? undefined;
  }

  return { pushed: true, prUrl };
}

/**
 * Extracts error type and message from a structured error string.
 *
 * Error messages from the LLM may be prefixed with known patterns
 * (e.g., "Cannot complete task:", "Task rejected:") which are parsed
 * into structured type/message for better error handling.
 *
 * @param errorMessage - Raw error message from LLM
 * @returns Parsed type and message
 */
function parseErrorType(errorMessage: string): {
  type: string;
  message: string;
} {
  const prefixes = [
    "Task rejected:",
    "Cannot access",
    "Insufficient context:",
    "Cannot complete task:",
  ];

  for (const prefix of prefixes) {
    if (errorMessage.startsWith(prefix)) {
      return {
        type: prefix.replace(":", ""),
        message: errorMessage.slice(prefix.length).trim(),
      };
    }
  }

  return {
    type: "Agent Error",
    message: errorMessage,
  };
}

/**
 * Creates an event handler that forwards Claude events to the TUI.
 *
 * @param tui - DevMode TUI instance
 * @returns Event handler function
 */
/** Maximum consecutive errors before aborting */
const MAX_CONSECUTIVE_ERRORS = 3;

function createTuiEventHandler(
  tui: DevMode
): (event: ClaudeEvent) => undefined | { abort: true; error: string } {
  let lastError = "";
  let sameErrorCount = 0;

  return (event: ClaudeEvent) => {
    if (event.type === "error") {
      if (event.message === lastError) {
        sameErrorCount++;
      } else {
        lastError = event.message;
        sameErrorCount = 1;
      }

      tui.addOutput(`${colors.red}[ERROR] ${event.message}${colors.reset}\n`);

      if (sameErrorCount >= MAX_CONSECUTIVE_ERRORS) {
        tui.addOutput(
          `\n${colors.red}[FATAL] Same error repeated ${sameErrorCount} times. Stopping.${colors.reset}\n`
        );
        tui.setError();
        return {
          abort: true,
          error: `Aborted after same error repeated ${MAX_CONSECUTIVE_ERRORS} times`,
        };
      }
      return;
    }

    handleTuiEvent(tui, event);
  };
}

/**
 * Dispatches a Claude event to the appropriate TUI method.
 *
 * Maps event types to TUI updates:
 * - text → addOutput
 * - tool_start/end → setTool
 * - tasks_defined → setTasks
 * - phases_defined → setPhases
 * - phase_start/done/failed → phase state updates
 * - error → setError
 *
 * @param tui - DevMode TUI instance
 * @param event - Claude event to handle
 */
function handleTuiEvent(tui: DevMode, event: ClaudeEvent): void {
  switch (event.type) {
    case "text":
      tui.addOutput(event.text);
      break;
    case "tool_start":
      tui.setTool(event.tool);
      break;
    case "tool_use":
      tui.addToolUse(event.tool, event.detail);
      break;
    case "tool_end":
      tui.setTool(undefined);
      break;
    case "tasks_defined":
      tui.setTasks(event.tasks);
      break;
    case "task_done":
      tui.markTaskDone(event.id);
      break;
    case "phases_defined":
      tui.setPhases(event.taskId, event.phases);
      break;
    case "criteria_defined":
      tui.setCriteria(event.taskId, event.criteria);
      break;
    case "phase_start":
      tui.setPhaseInProgress(event.id);
      break;
    case "phase_done":
      tui.markPhaseDone(event.id);
      break;
    case "phase_failed":
      tui.markPhaseFailed(event.id);
      break;
    case "criterion_passed":
      tui.markCriterionPassed(event.id);
      break;
    case "criterion_failed":
      tui.markCriterionFailed(event.id, event.reason);
      break;
    default:
      // "complete" and "error" events are handled elsewhere
      break;
  }
}

/**
 * Executes the breakdown phase with a fresh LLM context.
 *
 * The breakdown phase analyzes the user's task, explores the codebase,
 * and creates the initial `.ferix/PLAN.md` with task breakdown.
 *
 * @param engine - LLM engine instance
 * @param config - Ferix configuration
 * @param tui - Optional TUI for output display
 * @param onEvent - Optional event handler for progress tracking
 * @returns Execution result
 */
function executeBreakdown(
  engine: Engine,
  config: FerixConfig,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void
): Promise<ExecuteResult> {
  const prompt = createBreakdownPrompt(config.task);

  if (tui) {
    tui.addOutput(
      `${colors.cyan}[BREAKDOWN]${colors.reset} Analyzing task and creating plan...\n`
    );
  } else {
    logger.info("Analyzing task and creating plan...");
  }

  return engine.execute(prompt, {
    onEvent,
    writeToStdout: !tui,
  });
}

/**
 * Executes the planner phase for a specific task with a fresh LLM context.
 *
 * The planner reads the existing plan, breaks the task into phases,
 * identifies files to modify, and updates the plan file.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan (embedded in prompt for context)
 * @param task - The task to plan
 * @param tui - Optional TUI for output display
 * @param onEvent - Optional event handler for progress tracking
 * @returns Execution result
 */
function executePlanner(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void
): Promise<ExecuteResult> {
  const prompt = createPlannerPrompt(plan, task);

  if (tui) {
    tui.addOutput(
      `\n${colors.cyan}[PLANNING]${colors.reset} Task ${task.id}: ${task.title}\n`
    );
  } else {
    logger.info(`Planning task ${task.id}: ${task.title}`);
  }

  return engine.execute(prompt, {
    onEvent,
    writeToStdout: !tui,
  });
}

/**
 * Options for worker execution with optional verify retry context
 */
interface WorkerOptions {
  /** Error context from a previous failed verification */
  verifyError?: {
    command: string;
    exitCode: number;
    output: string;
  };
  /** Current verify attempt number (1-3) */
  verifyAttempt?: number;
}

/**
 * Executes the worker phase for a specific task with a fresh LLM context.
 *
 * The worker implements each planned phase, signals progress, runs
 * verification commands, and updates the plan file with completion notes.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan (embedded in prompt for context)
 * @param task - The task to execute (should have phases defined)
 * @param config - Ferix configuration (for verify commands and branch)
 * @param tui - Optional TUI for output display
 * @param onEvent - Optional event handler for progress tracking
 * @param options - Optional worker options with verify error context
 * @returns Execution result
 */
function executeWorker(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  config: FerixConfig,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void,
  options?: WorkerOptions
): Promise<ExecuteResult> {
  const prompt = createWorkerPrompt(plan, task, {
    verifyCommands: config.verify,
    branch: config.branch,
    verifyError: options?.verifyError,
    verifyAttempt: options?.verifyAttempt,
  });

  const isRetry = options?.verifyAttempt && options.verifyAttempt > 1;

  if (tui) {
    const retryText = isRetry
      ? ` (verify retry ${options.verifyAttempt}/${MAX_VERIFY_ATTEMPTS})`
      : "";
    tui.addOutput(
      `\n${colors.cyan}[WORKING]${colors.reset} Task ${task.id}: ${task.title}${retryText}\n`
    );
  } else {
    const retryText = isRetry
      ? ` (verify retry ${options?.verifyAttempt}/${MAX_VERIFY_ATTEMPTS})`
      : "";
    logger.info(`Executing task ${task.id}: ${task.title}${retryText}`);
  }

  return engine.execute(prompt, {
    onEvent,
    writeToStdout: !tui,
  });
}

/**
 * Result of a check phase (success criteria verification)
 */
interface CheckResult {
  /** Whether all criteria passed */
  passed: boolean;
  /** The raw output from the checker */
  output: string;
}

/**
 * Executes the check phase for a completed task with a fresh LLM context.
 *
 * The checker verifies each success criterion and signals pass/fail for each.
 * If any criterion fails, the task should be retried.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan (embedded in prompt for context)
 * @param task - The task to check (should be in done/in_progress state)
 * @param attemptNumber - Current attempt number (1-5)
 * @param tui - Optional TUI for output display
 * @param onEvent - Optional event handler for progress tracking
 * @returns Check result indicating pass/fail and raw output
 */
async function executeCheck(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  attemptNumber: number,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void
): Promise<CheckResult> {
  const { createCheckPrompt } = await import("../prompt/reviewer.js");
  const { extractCheckPassed, extractCheckFailed } = await import(
    "../engine/signals/index.js"
  );

  const prompt = createCheckPrompt(plan, task, attemptNumber);

  if (tui) {
    tui.addOutput(
      `\n${colors.cyan}[CHECKING]${colors.reset} Task ${task.id}: ${task.title} (attempt ${attemptNumber})\n`
    );
  } else {
    logger.info(
      `Checking task ${task.id}: ${task.title} (attempt ${attemptNumber})`
    );
  }

  const result = await engine.execute(prompt, {
    onEvent,
    writeToStdout: !tui,
  });

  // Determine pass/fail from the output signals
  const passed = extractCheckPassed(result.output);
  const failed = extractCheckFailed(result.output);

  // If neither signal found, default to checking if there were errors
  if (!(passed || failed)) {
    // No explicit signal - assume failed if execution had errors
    return {
      passed: result.success && !result.hasError,
      output: result.output,
    };
  }

  return {
    passed: passed && !failed,
    output: result.output,
  };
}

/**
 * Result of a review phase (code quality improvement)
 */
interface ReviewResult {
  /** Whether the review is complete */
  complete: boolean;
  /** Whether the reviewer made any code changes */
  changesMade: boolean;
  /** The raw output from the reviewer */
  output: string;
}

/**
 * Executes the review phase for a task with a fresh LLM context.
 *
 * The reviewer checks code quality and CAN make improvements:
 * - Conciseness: Remove unnecessary code, simplify logic
 * - Documentation: Add/improve comments
 * - Scalability: Identify potential issues
 *
 * If changes are made, Verify must be re-run.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan (embedded in prompt for context)
 * @param task - The task to review
 * @param attemptNumber - Current attempt number (1-3)
 * @param tui - Optional TUI for output display
 * @param onEvent - Optional event handler for progress tracking
 * @returns Review result indicating completion, changes, and raw output
 */
async function executeReview(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  attemptNumber: number,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void
): Promise<ReviewResult> {
  const { createReviewPrompt } = await import("../prompt/review.js");
  const { extractReviewComplete, extractReviewChangesMade } = await import(
    "../engine/signals/index.js"
  );

  const prompt = createReviewPrompt(plan, task, attemptNumber);

  if (tui) {
    tui.addOutput(
      `\n${colors.cyan}[REVIEWING]${colors.reset} Task ${task.id}: ${task.title} (attempt ${attemptNumber})\n`
    );
  } else {
    logger.info(
      `Reviewing task ${task.id}: ${task.title} (attempt ${attemptNumber})`
    );
  }

  const result = await engine.execute(prompt, {
    onEvent,
    writeToStdout: !tui,
  });

  // Determine completion and changes from output signals
  const complete = extractReviewComplete(result.output);
  const changesMade = extractReviewChangesMade(result.output);

  // If no completion signal, assume complete if no errors
  if (!complete) {
    return {
      complete: result.success && !result.hasError,
      changesMade,
      output: result.output,
    };
  }

  return {
    complete: true,
    changesMade,
    output: result.output,
  };
}

/**
 * Checks if a task has success criteria that need verification.
 *
 * @param task - The task to check
 * @returns True if the task has criteria to verify
 */
function taskHasCriteria(task: PlanTask): boolean {
  return Boolean(task.criteria && task.criteria.length > 0);
}

/**
 * Converts an ExecuteResult to a WorkerResult with success/failure info.
 *
 * @param result - Execution result from engine
 * @returns Normalized result with success flag and optional error
 */
function checkResult(result: ExecuteResult): WorkerResult {
  if (result.hasError && result.errorMessage) {
    return {
      success: false,
      failed: true,
      error: result.errorMessage,
    };
  }

  if (!result.success) {
    return {
      success: false,
      failed: true,
      error: "Execution failed",
    };
  }

  return {
    success: true,
    failed: false,
  };
}

/**
 * Handles an error in TUI mode, displaying message and waiting for exit.
 *
 * This function never returns - it waits for user to press Ctrl+C,
 * cleans up the TUI, and throws an AgentError.
 *
 * @param tui - DevMode TUI instance
 * @param errorMessage - Error message to display
 * @throws AgentError after user exits
 */
async function handleTuiError(
  tui: DevMode,
  errorMessage: string
): Promise<never> {
  tui.setError();
  tui.addOutput(`\n${colors.red}[ERROR]${colors.reset} ${errorMessage}`);
  tui.addOutput(`\n${colors.dim}Press Ctrl+C to exit${colors.reset}`);
  await tui.waitForExit();
  tui.cleanup();
  const { type, message } = parseErrorType(errorMessage);
  throw new AgentError(type, message);
}

/**
 * Handles successful completion in TUI mode.
 *
 * Displays completion message, handles git push/PR if configured,
 * and waits for user to exit.
 *
 * @param tui - DevMode TUI instance
 * @param config - Ferix configuration for git operations
 */
async function handleTuiComplete(
  tui: DevMode,
  config: FerixConfig
): Promise<void> {
  tui.setComplete();
  tui.addOutput(`\n${colors.green}[DONE]${colors.reset} All tasks complete!`);

  // Handle post-loop git operations and update TUI
  if (config.push && config.branch) {
    tui.addOutput(`\n${colors.dim}Pushing branch...${colors.reset}`);
    const postResult = await handlePostLoop(config);
    tui.setGitInfo({ pushed: postResult.pushed, prUrl: postResult.prUrl });
    if (postResult.prUrl) {
      tui.addOutput(`\n${colors.green}[PR]${colors.reset} ${postResult.prUrl}`);
    }
  }

  tui.addOutput(`\n${colors.dim}Press Ctrl+C to exit${colors.reset}`);
  await tui.waitForExit();
}

/**
 * Initializes the TUI with current git branch information.
 *
 * Silently ignores errors (e.g., not in a git repo).
 *
 * @param tui - DevMode TUI instance
 * @param config - Ferix configuration
 */
async function initTuiGitInfo(
  tui: DevMode,
  config: FerixConfig
): Promise<void> {
  try {
    const currentBranch = await getCurrentBranch();
    tui.setGitInfo({
      branch: config.branch ?? currentBranch,
      baseBranch: config.baseBranch,
      pushed: false,
    });
  } catch {
    // Not in a git repo or git not available - ignore
  }
}

/**
 * Executes the breakdown phase and returns the created plan (TUI mode).
 *
 * @param engine - LLM engine instance
 * @param config - Ferix configuration
 * @param tui - DevMode TUI instance
 * @param onEvent - Event handler for TUI updates
 * @returns The created plan
 * @throws AgentError if breakdown fails or plan not created
 */
async function executeBreakdownPhase(
  engine: Engine,
  config: FerixConfig,
  tui: DevMode,
  onEvent: (event: ClaudeEvent) => void
): Promise<Plan> {
  tui.setIteration(0);
  tui.setExecutionMode("breakdown");
  const result = await executeBreakdown(engine, config, tui, onEvent);
  const check = checkResult(result);

  if (check.failed) {
    return handleTuiError(tui, check.error ?? "Breakdown failed");
  }

  const plan = loadPlanIfExists();
  if (!plan) {
    return handleTuiError(tui, "Failed to create plan file");
  }

  return plan;
}

/**
 * Runs verification commands and handles the verify loop in TUI mode.
 *
 * @param config - Ferix configuration with verify commands
 * @param tui - DevMode TUI instance
 * @param verifyAttempt - Current verify attempt number
 * @returns Verify result with success status and optional error
 */
async function runVerifyPhase(
  config: FerixConfig,
  tui: DevMode,
  verifyAttempt: number
): Promise<{
  success: boolean;
  error?: { command: string; exitCode: number; output: string };
}> {
  if (config.verify.length === 0) {
    return { success: true };
  }

  tui.setVerifyMode(verifyAttempt);

  const result = await runVerifyCommands(config.verify, {
    onCommandStart: (command, index, total) => {
      tui.setVerifyCommand(command);
      tui.addOutput(
        `${colors.cyan}[VERIFY]${colors.reset} Running command ${index + 1}/${total}: ${command}\n`
      );
    },
    onCommandComplete: (cmdResult) => {
      if (cmdResult.success) {
        tui.addOutput(
          `${colors.green}[VERIFY PASSED]${colors.reset} ${cmdResult.command}\n`
        );
      } else {
        tui.addOutput(
          `${colors.red}[VERIFY FAILED]${colors.reset} ${cmdResult.command} (exit code ${cmdResult.exitCode})\n`
        );
        if (cmdResult.output) {
          // Show first few lines of output
          const lines = cmdResult.output.split("\n").slice(0, 10);
          for (const line of lines) {
            tui.addOutput(`${colors.dim}  ${line}${colors.reset}\n`);
          }
          if (cmdResult.output.split("\n").length > 10) {
            tui.addOutput(
              `${colors.dim}  ... (output truncated)${colors.reset}\n`
            );
          }
        }
      }
    },
  });

  tui.setVerifyCommand(undefined);

  if (result.success) {
    tui.addOutput(
      `${colors.green}[VERIFY COMPLETE]${colors.reset} All verification commands passed\n`
    );
    return { success: true };
  }

  return {
    success: false,
    error: result.error,
  };
}

/**
 * Result of the post-worker stages (Check → Verify → Review)
 */
interface PostWorkerStagesResult {
  /** Updated plan after all stages */
  plan: Plan;
  /** Updated task after all stages */
  task: PlanTask;
  /** Whether all stages passed */
  success: boolean;
  /** Fatal error if max attempts reached */
  fatalError?: string;
  /** Whether worker needs to retry (check failed) */
  retryWorker: boolean;
}

/**
 * Helper to create a StageStatus object
 */
function createStageStatus(
  status: "pending" | "in_progress" | "passed" | "failed",
  attempts?: number,
  startedAt?: number,
  completedAt?: number
): StageStatus {
  return { status, attempts, startedAt, completedAt };
}

/**
 * Format failed criteria list for error message
 */
function formatFailedCriteria(task: PlanTask): string {
  const failedCriteria =
    task.criteria?.filter((c) => c.status === "failed") ?? [];
  return failedCriteria
    .map((c) => `  - ${c.description}: ${c.failureReason ?? "Unknown"}`)
    .join("\n");
}

/**
 * Context for TUI stage execution
 */
interface TuiStageContext {
  engine: Engine;
  config: FerixConfig;
  tui: DevMode;
  onEvent: (event: ClaudeEvent) => void;
  checkAttempt: number;
  hasVerify: boolean;
}

/**
 * Execute CHECK stage in TUI mode
 */
async function executeCheckStageTui(
  plan: Plan,
  task: PlanTask,
  ctx: TuiStageContext
): Promise<PostWorkerStagesResult | null> {
  const checkStart = Date.now();
  const hasCriteria = taskHasCriteria(task);

  ctx.tui.setExecutionMode("checking", task.id);
  ctx.tui.setCheckMode(ctx.checkAttempt, task.id);
  ctx.tui.setStageStatus(
    String(task.id),
    "check",
    createStageStatus("in_progress", ctx.checkAttempt, checkStart)
  );

  if (!hasCriteria) {
    ctx.tui.addOutput(
      `\n${colors.green}[CHECK PASSED]${colors.reset} No criteria to verify for task ${task.id}\n`
    );
    ctx.tui.setStageStatus(
      String(task.id),
      "check",
      createStageStatus("passed", ctx.checkAttempt, checkStart, Date.now())
    );
    return null; // Continue to next stage
  }

  const checkResult = await executeCheck(
    ctx.engine,
    plan,
    task,
    ctx.checkAttempt,
    ctx.tui,
    ctx.onEvent
  );

  // Reload plan after check
  const updatedPlan = loadPlan();
  const updatedTask = updatedPlan.tasks.find((t) => t.id === task.id) ?? task;

  if (checkResult.passed) {
    ctx.tui.addOutput(
      `\n${colors.green}[CHECK PASSED]${colors.reset} All criteria verified for task ${task.id}\n`
    );
    ctx.tui.setStageStatus(
      String(task.id),
      "check",
      createStageStatus("passed", ctx.checkAttempt, checkStart, Date.now())
    );
    return null; // Continue to next stage (plan/task updated in caller)
  }

  ctx.tui.addOutput(
    `\n${colors.red}[CHECK FAILED]${colors.reset} Criteria not met for task ${task.id}\n`
  );
  ctx.tui.setStageStatus(
    String(task.id),
    "check",
    createStageStatus("failed", ctx.checkAttempt, checkStart, Date.now())
  );

  if (ctx.checkAttempt >= MAX_CHECK_ATTEMPTS) {
    return {
      plan: updatedPlan,
      task: updatedTask,
      success: false,
      fatalError: `Task ${task.id} failed after ${MAX_CHECK_ATTEMPTS} check attempts.\n\nFailed criteria:\n${formatFailedCriteria(updatedTask)}`,
      retryWorker: false,
    };
  }

  ctx.tui.addOutput(
    `\n${colors.yellow}[CHECK RETRY]${colors.reset} Retrying worker for task ${task.id} (check attempt ${ctx.checkAttempt + 1})\n`
  );
  return {
    plan: updatedPlan,
    task: updatedTask,
    success: false,
    retryWorker: true,
  };
}

/**
 * Execute VERIFY stage in TUI mode
 */
async function executeVerifyStageTui(
  plan: Plan,
  task: PlanTask,
  ctx: TuiStageContext,
  attemptNum: number
): Promise<PostWorkerStagesResult | null> {
  const verifyStart = Date.now();
  ctx.tui.setStageStatus(
    String(task.id),
    "verify",
    createStageStatus("in_progress", attemptNum, verifyStart)
  );

  if (!ctx.hasVerify) {
    ctx.tui.addOutput(
      `\n${colors.green}[VERIFY PASSED]${colors.reset} No verify commands configured\n`
    );
    ctx.tui.setStageStatus(
      String(task.id),
      "verify",
      createStageStatus("passed", attemptNum, verifyStart, Date.now())
    );
    return null; // Continue to next stage
  }

  const verifyResult = await runVerifyPhase(ctx.config, ctx.tui, 1);

  if (verifyResult.success) {
    ctx.tui.setStageStatus(
      String(task.id),
      "verify",
      createStageStatus("passed", attemptNum, verifyStart, Date.now())
    );
    return null; // Continue to next stage
  }

  ctx.tui.setStageStatus(
    String(task.id),
    "verify",
    createStageStatus("failed", attemptNum, verifyStart, Date.now())
  );

  if (ctx.checkAttempt >= MAX_CHECK_ATTEMPTS) {
    const errorMsg = verifyResult.error
      ? `\n\nFailed command: ${verifyResult.error.command}\nExit code: ${verifyResult.error.exitCode}\n\nOutput:\n${verifyResult.error.output}`
      : "";
    return {
      plan,
      task,
      success: false,
      fatalError: `Task ${task.id} failed verification.${errorMsg}`,
      retryWorker: false,
    };
  }

  ctx.tui.addOutput(
    `\n${colors.yellow}[VERIFY FAILED]${colors.reset} Retrying worker for task ${task.id}\n`
  );
  return { plan, task, success: false, retryWorker: true };
}

/**
 * Execute REVIEW stage loop in TUI mode
 */
async function executeReviewStageTui(
  initialPlan: Plan,
  initialTask: PlanTask,
  ctx: TuiStageContext
): Promise<PostWorkerStagesResult> {
  let plan = initialPlan;
  let task = initialTask;
  let reviewAttempt = 1;

  while (reviewAttempt <= MAX_REVIEW_ATTEMPTS) {
    const reviewStart = Date.now();
    ctx.tui.setExecutionMode("reviewing", task.id);
    ctx.tui.setReviewMode(reviewAttempt, task.id);
    ctx.tui.setStageStatus(
      String(task.id),
      "review",
      createStageStatus("in_progress", reviewAttempt, reviewStart)
    );

    const reviewResult = await executeReview(
      ctx.engine,
      plan,
      task,
      reviewAttempt,
      ctx.tui,
      ctx.onEvent
    );

    plan = loadPlan();
    task = plan.tasks.find((t) => t.id === task.id) ?? task;

    if (!reviewResult.complete) {
      ctx.tui.setStageStatus(
        String(task.id),
        "review",
        createStageStatus("failed", reviewAttempt, reviewStart, Date.now())
      );
      reviewAttempt++;
      if (reviewAttempt > MAX_REVIEW_ATTEMPTS) {
        return {
          plan,
          task,
          success: false,
          fatalError: `Task ${task.id} review failed after ${MAX_REVIEW_ATTEMPTS} attempts`,
          retryWorker: false,
        };
      }
      ctx.tui.addOutput(
        `\n${colors.yellow}[REVIEW RETRY]${colors.reset} Retrying review for task ${task.id} (attempt ${reviewAttempt})\n`
      );
      continue;
    }

    ctx.tui.setReviewChanges(String(task.id), reviewResult.changesMade);

    // Re-run verify if changes were made
    if (reviewResult.changesMade && ctx.hasVerify) {
      const reVerifyResult = await handleReviewVerifyTui(
        task,
        ctx,
        reviewAttempt,
        reviewStart
      );
      if (reVerifyResult.retry) {
        reviewAttempt++;
        if (reviewAttempt > MAX_REVIEW_ATTEMPTS) {
          return {
            plan,
            task,
            success: false,
            fatalError:
              reVerifyResult.fatalError ??
              `Task ${task.id} verify failed after review`,
            retryWorker: false,
          };
        }
        ctx.tui.addOutput(
          `\n${colors.yellow}[VERIFY FAILED]${colors.reset} Review changes broke verify. Retrying review (attempt ${reviewAttempt})\n`
        );
        continue;
      }
    }

    ctx.tui.addOutput(
      `\n${colors.green}[REVIEW PASSED]${colors.reset} Code quality review complete for task ${task.id}${reviewResult.changesMade ? " (changes made)" : ""}\n`
    );
    ctx.tui.setStageStatus(
      String(task.id),
      "review",
      createStageStatus("passed", reviewAttempt, reviewStart, Date.now())
    );
    return { plan, task, success: true, retryWorker: false };
  }

  return {
    plan,
    task,
    success: false,
    fatalError: `Task ${task.id} review failed after ${MAX_REVIEW_ATTEMPTS} attempts`,
    retryWorker: false,
  };
}

/**
 * Handle verify after review changes in TUI mode
 */
async function handleReviewVerifyTui(
  task: PlanTask,
  ctx: TuiStageContext,
  reviewAttempt: number,
  reviewStart: number
): Promise<{ retry: boolean; fatalError?: string }> {
  ctx.tui.addOutput(
    `\n${colors.cyan}[REVIEW CHANGES]${colors.reset} Re-running verify after code changes...\n`
  );

  const reVerifyStart = Date.now();
  ctx.tui.setStageStatus(
    String(task.id),
    "verify",
    createStageStatus("in_progress", 2, reVerifyStart)
  );

  const reVerifyResult = await runVerifyPhase(ctx.config, ctx.tui, 1);

  if (reVerifyResult.success) {
    ctx.tui.setStageStatus(
      String(task.id),
      "verify",
      createStageStatus("passed", 2, reVerifyStart, Date.now())
    );
    return { retry: false };
  }

  ctx.tui.setStageStatus(
    String(task.id),
    "verify",
    createStageStatus("failed", 2, reVerifyStart, Date.now())
  );
  ctx.tui.setStageStatus(
    String(task.id),
    "review",
    createStageStatus("failed", reviewAttempt, reviewStart, Date.now())
  );

  if (reviewAttempt >= MAX_REVIEW_ATTEMPTS) {
    const errorMsg = reVerifyResult.error
      ? `\n\nFailed command: ${reVerifyResult.error.command}\nExit code: ${reVerifyResult.error.exitCode}`
      : "";
    return {
      retry: true,
      fatalError: `Task ${task.id} verify failed after review changes.${errorMsg}`,
    };
  }

  return { retry: true };
}

/**
 * Executes the three post-worker stages in TUI mode: Check → Verify → Review
 */
async function executePostWorkerStagesTui(
  engine: Engine,
  currentPlan: Plan,
  taskWithPhases: PlanTask,
  config: FerixConfig,
  tui: DevMode,
  onEvent: (event: ClaudeEvent) => void,
  checkAttempt: number
): Promise<PostWorkerStagesResult> {
  let plan = currentPlan;
  let task = taskWithPhases;

  const ctx: TuiStageContext = {
    engine,
    config,
    tui,
    onEvent,
    checkAttempt,
    hasVerify: config.verify.length > 0,
  };

  // STAGE 1: CHECK
  const checkResult = await executeCheckStageTui(plan, task, ctx);
  if (checkResult) {
    return checkResult;
  }

  // Reload after check
  plan = loadPlan();
  task = plan.tasks.find((t) => t.id === task.id) ?? task;

  // STAGE 2: VERIFY
  const verifyResult = await executeVerifyStageTui(plan, task, ctx, 1);
  if (verifyResult) {
    return verifyResult;
  }

  // STAGE 3: REVIEW
  return executeReviewStageTui(plan, task, ctx);
}

/**
 * Executes a single task (planner + worker + three-stage post-worker) in TUI mode.
 *
 * This is the core of the planner/worker/check/verify/review loop:
 * 1. Run planner to break task into phases
 * 2. Reload plan to get phases
 * 3. Run worker to execute phases
 * 4. Run three post-worker stages: Check → Verify → Review
 * 5. If Check fails, retry worker (up to MAX_CHECK_ATTEMPTS)
 * 6. If Verify fails, retry worker
 * 7. If Review makes changes and breaks Verify, retry Review
 * 8. Reload and return updated plan
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan
 * @param task - Task to execute
 * @param config - Ferix configuration
 * @param tui - DevMode TUI instance
 * @param onEvent - Event handler for TUI updates
 * @returns Updated plan after task completion
 * @throws AgentError if any phase fails after max attempts
 */
async function executeTaskTui(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  config: FerixConfig,
  tui: DevMode,
  onEvent: (event: ClaudeEvent) => void
): Promise<Plan> {
  // Phase A: Plan the task
  tui.setExecutionMode("planning", task.id);
  const plannerResult = await executePlanner(engine, plan, task, tui, onEvent);
  const plannerCheck = checkResult(plannerResult);

  if (plannerCheck.failed) {
    return handleTuiError(tui, plannerCheck.error ?? "Planning failed");
  }

  // Reload and get task with phases
  let currentPlan = loadPlan();
  let taskWithPhases = currentPlan.tasks.find((t) => t.id === task.id);

  if (!taskWithPhases) {
    return handleTuiError(tui, `Task ${task.id} not found after planning`);
  }

  // Phase B: Worker + Post-worker stages with check retry loop
  let checkAttempt = (taskWithPhases.attempts ?? 0) + 1;

  while (checkAttempt <= MAX_CHECK_ATTEMPTS) {
    // Execute the worker
    tui.setExecutionMode("working", task.id);

    const workerResult = await executeWorker(
      engine,
      currentPlan,
      taskWithPhases,
      config,
      tui,
      onEvent
    );
    const workerCheck = checkResult(workerResult);

    if (workerCheck.failed) {
      return handleTuiError(tui, workerCheck.error ?? "Worker failed");
    }

    // Reload plan after worker
    currentPlan = loadPlan();
    taskWithPhases =
      currentPlan.tasks.find((t) => t.id === task.id) ?? taskWithPhases;

    // Execute three post-worker stages: Check → Verify → Review
    const stagesResult = await executePostWorkerStagesTui(
      engine,
      currentPlan,
      taskWithPhases,
      config,
      tui,
      onEvent,
      checkAttempt
    );

    currentPlan = stagesResult.plan;
    taskWithPhases = stagesResult.task;

    if (stagesResult.fatalError) {
      return handleTuiError(tui, stagesResult.fatalError);
    }

    if (stagesResult.success) {
      return currentPlan;
    }

    if (stagesResult.retryWorker) {
      checkAttempt++;
      continue;
    }

    // Something went wrong but not a retry scenario
    return handleTuiError(tui, `Task ${task.id} failed unexpectedly`);
  }

  return handleTuiError(
    tui,
    `Task ${task.id} failed after ${MAX_CHECK_ATTEMPTS} check attempts`
  );
}

/**
 * Converts a Plan's tasks to TUI Task format for display.
 *
 * This is used when resuming from an existing plan to populate the TUI
 * with the task state from the plan file.
 *
 * @param plan - The plan to convert
 * @returns Array of TUI Task objects
 */
function planToTuiTasks(plan: Plan): Task[] {
  return plan.tasks.map((task) => {
    const phases: Phase[] = (task.phases ?? []).map((p) => ({
      id: p.id,
      description: p.description,
      status: p.completed ? "done" : "pending",
    }));

    // Map criteria from plan to TUI format
    const criteria: Criterion[] = (task.criteria ?? []).map((c) => ({
      id: c.id,
      description: c.description,
      status: c.status,
      failureReason: c.failureReason,
    }));

    return {
      id: String(task.id),
      description: task.title,
      done: task.status === "done",
      phases,
      criteria: criteria.length > 0 ? criteria : undefined,
      attempts: task.attempts,
    };
  });
}

/**
 * Executes the main loop in dev mode with full-screen TUI.
 *
 * Flow:
 * 1. Initialize TUI with git info
 * 2. Check for existing plan (resume support)
 * 3. Run breakdown if no plan exists
 * 4. Loop: planner → worker for each task until complete
 * 5. Handle git push/PR if configured
 *
 * @param engine - LLM engine instance
 * @param config - Ferix configuration
 */
async function executeLoopDevMode(
  engine: Engine,
  config: FerixConfig
): Promise<void> {
  const tui = new DevMode(config.task, "~");
  tui.start();

  await initTuiGitInfo(tui, config);

  const onEvent = createTuiEventHandler(tui);

  try {
    // Handle existing plan based on resume flag
    let plan: Plan | null = null;
    const existingPlan = loadPlanIfExists();

    if (config.resume) {
      // User wants to continue from existing plan
      if (existingPlan) {
        plan = existingPlan;
        tui.setTasks(planToTuiTasks(plan));
        tui.addOutput(
          `${colors.cyan}[RESUME]${colors.reset} Continuing from existing plan with ${plan.tasks.length} tasks\n`
        );
      } else {
        tui.addOutput(
          `${colors.yellow}[WARN]${colors.reset} No existing plan found to continue from. Starting fresh.\n`
        );
      }
    } else if (existingPlan) {
      // Default: archive old plan and start fresh
      const result = archivePlan();
      if (result.success && result.filename) {
        tui.addOutput(
          `${colors.dim}[INFO] Archived previous plan to .ferix/archive/${result.filename}${colors.reset}\n`
        );
      }
    }

    // Phase 0: Breakdown (if no plan loaded)
    if (!plan) {
      plan = await executeBreakdownPhase(engine, config, tui, onEvent);
      // Update TUI with tasks from plan (includes criteria extracted during breakdown)
      tui.setTasks(planToTuiTasks(plan));
    }

    // Main loop: planner → worker for each task
    let taskCount = 0;
    while (plan) {
      const nextTask = getNextTask(plan);
      if (!nextTask) {
        await handleTuiComplete(tui, config);
        break;
      }

      taskCount++;
      tui.setIteration(taskCount);
      plan = await executeTaskTui(engine, plan, nextTask, config, tui, onEvent);
    }
  } finally {
    tui.cleanup();
  }
}

/**
 * Handles existing plan based on resume flag (standard mode).
 *
 * @param config - Ferix configuration
 * @returns Existing plan if resuming, null otherwise
 */
function handleExistingPlanStandard(config: FerixConfig): Plan | null {
  const existingPlan = loadPlanIfExists();

  if (config.resume) {
    if (existingPlan) {
      logger.info(
        `Continuing from existing plan with ${existingPlan.tasks.length} tasks`
      );
      return existingPlan;
    }
    logger.warn("No existing plan found to continue from. Starting fresh.");
    return null;
  }

  if (existingPlan) {
    const result = archivePlan();
    if (result.success && result.filename) {
      logger.info(
        `Archived previous plan to .ferix/archive/${result.filename}`
      );
    }
  }

  return null;
}

/**
 * Runs verification commands in standard mode (with logging).
 *
 * @param config - Ferix configuration with verify commands
 * @param verifyAttempt - Current verify attempt number
 * @returns Verify result with success status and optional error
 */
async function runVerifyPhaseStandard(
  config: FerixConfig,
  verifyAttempt: number
): Promise<{
  success: boolean;
  error?: { command: string; exitCode: number; output: string };
}> {
  if (config.verify.length === 0) {
    return { success: true };
  }

  logger.info(
    `--- Verifying (attempt ${verifyAttempt}/${MAX_VERIFY_ATTEMPTS}) ---`
  );

  const result = await runVerifyCommands(config.verify, {
    onCommandStart: (command, index, total) => {
      logger.info(`Running verify command ${index + 1}/${total}: ${command}`);
    },
    onCommandComplete: (cmdResult) => {
      if (cmdResult.success) {
        logger.success(`Verify passed: ${cmdResult.command}`);
      } else {
        logger.error(
          `Verify failed: ${cmdResult.command} (exit code ${cmdResult.exitCode})`
        );
        if (cmdResult.output) {
          // Show first few lines of output
          const lines = cmdResult.output.split("\n").slice(0, 10);
          for (const line of lines) {
            logger.info(`  ${line}`);
          }
          if (cmdResult.output.split("\n").length > 10) {
            logger.info("  ... (output truncated)");
          }
        }
      }
    },
  });

  if (result.success) {
    logger.success("All verification commands passed");
    return { success: true };
  }

  return {
    success: false,
    error: result.error,
  };
}

/**
 * Context for standard stage execution
 */
interface StandardStageContext {
  engine: Engine;
  config: FerixConfig;
  checkAttempt: number;
  hasVerify: boolean;
}

/**
 * Execute CHECK stage in standard mode
 */
async function executeCheckStageStandard(
  plan: Plan,
  task: PlanTask,
  ctx: StandardStageContext
): Promise<PostWorkerStagesResult | null> {
  logger.info(`--- Checking (attempt ${ctx.checkAttempt}) ---`);
  const hasCriteria = taskHasCriteria(task);

  if (!hasCriteria) {
    logger.success("No criteria to verify - check passed");
    return null; // Continue to next stage
  }

  const checkResult = await executeCheck(
    ctx.engine,
    plan,
    task,
    ctx.checkAttempt,
    null
  );

  const updatedPlan = loadPlan();
  const updatedTask = updatedPlan.tasks.find((t) => t.id === task.id) ?? task;

  if (checkResult.passed) {
    logger.success(`All criteria verified for task ${task.id}`);
    return null;
  }

  logger.error(`Check failed for task ${task.id}`);

  if (ctx.checkAttempt >= MAX_CHECK_ATTEMPTS) {
    return {
      plan: updatedPlan,
      task: updatedTask,
      success: false,
      fatalError: `Task ${task.id} failed after ${MAX_CHECK_ATTEMPTS} check attempts.\n\nFailed criteria:\n${formatFailedCriteria(updatedTask)}`,
      retryWorker: false,
    };
  }

  logger.warn(
    `Retrying worker for task ${task.id} (check attempt ${ctx.checkAttempt + 1})`
  );
  return {
    plan: updatedPlan,
    task: updatedTask,
    success: false,
    retryWorker: true,
  };
}

/**
 * Execute VERIFY stage in standard mode
 */
async function executeVerifyStageStandard(
  plan: Plan,
  task: PlanTask,
  ctx: StandardStageContext
): Promise<PostWorkerStagesResult | null> {
  if (!ctx.hasVerify) {
    logger.success("No verify commands configured - verify passed");
    return null;
  }

  const verifyResult = await runVerifyPhaseStandard(ctx.config, 1);

  if (verifyResult.success) {
    return null;
  }

  if (ctx.checkAttempt >= MAX_CHECK_ATTEMPTS) {
    const errorMsg = verifyResult.error
      ? `\n\nFailed command: ${verifyResult.error.command}\nExit code: ${verifyResult.error.exitCode}\n\nOutput:\n${verifyResult.error.output}`
      : "";
    return {
      plan,
      task,
      success: false,
      fatalError: `Task ${task.id} failed verification.${errorMsg}`,
      retryWorker: false,
    };
  }

  logger.warn(`Retrying worker for task ${task.id} after verify failure`);
  return { plan, task, success: false, retryWorker: true };
}

/**
 * Handle verify after review changes in standard mode
 * Returns true if verify failed and review should retry
 */
async function handleReviewVerifyStandard(
  config: FerixConfig,
  taskId: number,
  reviewAttempt: number
): Promise<{ retry: boolean; fatalError?: string }> {
  logger.info("Review made changes - re-running verify...");
  const reVerifyResult = await runVerifyPhaseStandard(config, 1);

  if (reVerifyResult.success) {
    return { retry: false };
  }

  if (reviewAttempt >= MAX_REVIEW_ATTEMPTS) {
    const errorMsg = reVerifyResult.error
      ? `\n\nFailed command: ${reVerifyResult.error.command}\nExit code: ${reVerifyResult.error.exitCode}`
      : "";
    return {
      retry: true,
      fatalError: `Task ${taskId} verify failed after review changes.${errorMsg}`,
    };
  }

  return { retry: true };
}

/**
 * Execute REVIEW stage loop in standard mode
 */
async function executeReviewStageStandard(
  initialPlan: Plan,
  initialTask: PlanTask,
  ctx: StandardStageContext
): Promise<PostWorkerStagesResult> {
  let plan = initialPlan;
  let task = initialTask;
  let reviewAttempt = 1;

  while (reviewAttempt <= MAX_REVIEW_ATTEMPTS) {
    logger.info(`--- Reviewing (attempt ${reviewAttempt}) ---`);

    const reviewResult = await executeReview(
      ctx.engine,
      plan,
      task,
      reviewAttempt,
      null
    );

    plan = loadPlan();
    task = plan.tasks.find((t) => t.id === task.id) ?? task;

    if (!reviewResult.complete) {
      reviewAttempt++;
      if (reviewAttempt > MAX_REVIEW_ATTEMPTS) {
        return {
          plan,
          task,
          success: false,
          fatalError: `Task ${task.id} review failed after ${MAX_REVIEW_ATTEMPTS} attempts`,
          retryWorker: false,
        };
      }
      logger.warn(
        `Retrying review for task ${task.id} (attempt ${reviewAttempt})`
      );
      continue;
    }

    // Re-run verify if changes were made
    if (reviewResult.changesMade && ctx.hasVerify) {
      const reVerifyResult = await handleReviewVerifyStandard(
        ctx.config,
        task.id,
        reviewAttempt
      );
      if (reVerifyResult.retry) {
        reviewAttempt++;
        if (reviewAttempt > MAX_REVIEW_ATTEMPTS) {
          return {
            plan,
            task,
            success: false,
            fatalError:
              reVerifyResult.fatalError ??
              `Task ${task.id} verify failed after review`,
            retryWorker: false,
          };
        }
        logger.warn(
          `Review changes broke verify. Retrying review (attempt ${reviewAttempt})`
        );
        continue;
      }
    }

    logger.success(
      `Code quality review complete for task ${task.id}${reviewResult.changesMade ? " (changes made)" : ""}`
    );
    return { plan, task, success: true, retryWorker: false };
  }

  return {
    plan,
    task,
    success: false,
    fatalError: `Task ${task.id} review failed after ${MAX_REVIEW_ATTEMPTS} attempts`,
    retryWorker: false,
  };
}

/**
 * Executes three post-worker stages in standard mode: Check → Verify → Review
 */
async function executePostWorkerStagesStandard(
  engine: Engine,
  currentPlan: Plan,
  currentTask: PlanTask,
  config: FerixConfig,
  checkAttempt: number
): Promise<PostWorkerStagesResult> {
  let plan = currentPlan;
  let task = currentTask;

  const ctx: StandardStageContext = {
    engine,
    config,
    checkAttempt,
    hasVerify: config.verify.length > 0,
  };

  // STAGE 1: CHECK
  const checkResult = await executeCheckStageStandard(plan, task, ctx);
  if (checkResult) {
    return checkResult;
  }

  // Reload after check
  plan = loadPlan();
  task = plan.tasks.find((t) => t.id === task.id) ?? task;

  // STAGE 2: VERIFY
  const verifyResult = await executeVerifyStageStandard(plan, task, ctx);
  if (verifyResult) {
    return verifyResult;
  }

  // STAGE 3: REVIEW
  return executeReviewStageStandard(plan, task, ctx);
}

/**
 * Executes worker + three-stage post-worker flow for a task in standard mode.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan
 * @param task - Task to execute (with phases)
 * @param config - Ferix configuration
 * @returns Updated plan after task completion
 * @throws AgentError if any phase fails after max attempts
 */
async function executeTaskStandard(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  config: FerixConfig
): Promise<Plan> {
  let currentPlan = plan;
  let currentTask = task;
  let checkAttempt = (currentTask.attempts ?? 0) + 1;

  while (checkAttempt <= MAX_CHECK_ATTEMPTS) {
    // Execute the worker
    logger.info(`--- Executing (check attempt ${checkAttempt}) ---`);

    const workerResult = await executeWorker(
      engine,
      currentPlan,
      currentTask,
      config,
      null
    );
    const workerCheck = checkResult(workerResult);

    if (workerCheck.failed) {
      throw new AgentError("Worker", workerCheck.error || "Failed");
    }

    // Reload plan after worker
    currentPlan = loadPlan();
    currentTask =
      currentPlan.tasks.find((t) => t.id === task.id) ?? currentTask;

    // Execute three post-worker stages: Check → Verify → Review
    const stagesResult = await executePostWorkerStagesStandard(
      engine,
      currentPlan,
      currentTask,
      config,
      checkAttempt
    );

    currentPlan = stagesResult.plan;
    currentTask = stagesResult.task;

    if (stagesResult.fatalError) {
      throw new AgentError("PostWorker", stagesResult.fatalError);
    }

    if (stagesResult.success) {
      return currentPlan;
    }

    if (stagesResult.retryWorker) {
      checkAttempt++;
      continue;
    }

    // Something went wrong but not a retry scenario
    throw new AgentError("PostWorker", `Task ${task.id} failed unexpectedly`);
  }

  throw new AgentError(
    "Check",
    `Task ${task.id} failed after ${MAX_CHECK_ATTEMPTS} check attempts`
  );
}

/**
 * Executes the main loop in standard mode (no TUI).
 *
 * Used in CI environments or when stdout is piped. Uses simple
 * logging instead of the full-screen TUI.
 *
 * @param engine - LLM engine instance
 * @param config - Ferix configuration
 * @throws AgentError if any phase fails
 * @throws ExecutionError if plan file operations fail
 */
async function executeLoopStandard(
  engine: Engine,
  config: FerixConfig
): Promise<void> {
  // Handle existing plan based on resume flag
  let plan = handleExistingPlanStandard(config);

  // Phase 0: Breakdown (if no plan loaded)
  if (!plan) {
    logger.info("=== BREAKDOWN PHASE ===");
    const breakdownResult = await executeBreakdown(engine, config, null);
    const breakdownCheck = checkResult(breakdownResult);

    if (breakdownCheck.failed) {
      throw new AgentError("Breakdown", breakdownCheck.error ?? "Failed");
    }

    plan = loadPlanIfExists();
    if (!plan) {
      throw new ExecutionError("Failed to create plan file");
    }
  }

  // Main loop: planner → worker → reviewer for each task
  let taskCount = 0;
  while (plan) {
    const nextTask = getNextTask(plan);
    if (!nextTask) {
      logger.success("All tasks complete!");
      break;
    }

    taskCount++;
    logger.info(`\n=== TASK ${taskCount}: ${nextTask.title} ===`);

    // Phase A: Plan the task
    logger.info("--- Planning ---");
    const plannerResult = await executePlanner(engine, plan, nextTask, null);
    const plannerCheck = checkResult(plannerResult);

    if (plannerCheck.failed) {
      throw new AgentError("Planning", plannerCheck.error || "Failed");
    }

    plan = loadPlan();

    // Re-fetch task with phases
    const taskWithPhases = plan.tasks.find((t) => t.id === nextTask.id);
    if (!taskWithPhases) {
      throw new ExecutionError(`Task ${nextTask.id} not found after planning`);
    }

    // Phase B + C: Execute and review
    plan = await executeTaskStandard(engine, plan, taskWithPhases, config);
  }

  // Handle post-loop operations
  await handlePostLoop(config);
}

/**
 * Main entry point for the Ferix execution loop.
 *
 * Implements the planner/worker architecture where each phase (breakdown,
 * planner, worker) gets a fresh LLM context, with `.ferix/PLAN.md` serving
 * as persistent memory between calls.
 *
 * @param config - Ferix configuration including task, git settings, verify commands
 * @throws DependencyError if Claude CLI is not available
 * @throws AgentError if any execution phase fails
 * @throws ExecutionError if plan file operations fail
 */
export async function runLoop(config: FerixConfig): Promise<void> {
  // Show dry run if requested (before any side effects)
  if (config.dryRun) {
    const prompt = createBreakdownPrompt(config.task);
    logger.prompt(prompt);
    logger.info("Dry run complete. No changes made.");
    return;
  }

  // Setup git branch (only if not dry run)
  await setupGitBranch(config);

  // Initialize progress file (only if not dry run)
  if (config.progress) {
    await initProgress(config.progress);
  }

  const engine = getEngine("claude");

  if (!(await engine.isAvailable())) {
    throw new DependencyError(
      MESSAGES.CLAUDE_NOT_INSTALLED,
      MESSAGES.CLAUDE_INSTALL_HINT
    );
  }

  // Use dev mode TUI by default, unless in CI or piped
  const useDevMode = process.stdout.isTTY && !process.env.CI;

  if (useDevMode) {
    await executeLoopDevMode(engine, config);
  } else {
    await executeLoopStandard(engine, config);
    logger.success("Ferix loop finished");
  }
}
