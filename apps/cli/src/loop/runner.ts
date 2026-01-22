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
  extractReviewFailed,
  extractReviewPassed,
} from "../engine/signals/index.js";
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
import { createReviewerPrompt } from "../prompt/reviewer.js";
import { createWorkerPrompt } from "../prompt/worker.js";
import { colors } from "../tui/ansi.js";
import { DevMode } from "../tui/dev-mode.js";
import type { Criterion, Phase, Task } from "../types/config.js";
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

/** Maximum number of verify retry attempts before failing */
const MAX_VERIFY_ATTEMPTS = 3;

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
function createTuiEventHandler(tui: DevMode): (event: ClaudeEvent) => void {
  return (event: ClaudeEvent) => handleTuiEvent(tui, event);
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
    case "error":
      tui.setError();
      break;
    default:
      // "complete" event is handled after execute returns
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

/** Maximum number of review attempts before marking task as failed */
const MAX_REVIEW_ATTEMPTS = 5;

/**
 * Result of a review phase
 */
interface ReviewResult {
  /** Whether all criteria passed */
  passed: boolean;
  /** The raw output from the reviewer */
  output: string;
}

/**
 * Executes the reviewer phase for a completed task with a fresh LLM context.
 *
 * The reviewer verifies each success criterion and signals pass/fail for each.
 * If any criterion fails, the task should be retried.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan (embedded in prompt for context)
 * @param task - The task to review (should be in done/in_progress state)
 * @param attemptNumber - Current attempt number (1-5)
 * @param tui - Optional TUI for output display
 * @param onEvent - Optional event handler for progress tracking
 * @returns Review result indicating pass/fail and raw output
 */
async function executeReviewer(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  attemptNumber: number,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void
): Promise<ReviewResult> {
  const prompt = createReviewerPrompt(plan, task, attemptNumber);

  if (tui) {
    tui.addOutput(
      `\n${colors.cyan}[REVIEWING]${colors.reset} Task ${task.id}: ${task.title} (attempt ${attemptNumber}/${MAX_REVIEW_ATTEMPTS})\n`
    );
  } else {
    logger.info(
      `Reviewing task ${task.id}: ${task.title} (attempt ${attemptNumber}/${MAX_REVIEW_ATTEMPTS})`
    );
  }

  const result = await engine.execute(prompt, {
    onEvent,
    writeToStdout: !tui,
  });

  // Determine pass/fail from the output signals
  const passed = extractReviewPassed(result.output);
  const failed = extractReviewFailed(result.output);

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
 * Result of executing the verify retry loop
 */
interface VerifyLoopResult {
  /** Updated plan after all iterations */
  plan: Plan;
  /** Updated task after all iterations */
  task: PlanTask;
  /** Fatal error if max attempts reached */
  fatalError?: string;
}

/**
 * Executes the worker + verify retry loop in TUI mode.
 *
 * @returns Result with updated plan/task or fatal error
 */
async function executeVerifyLoopTui(
  engine: Engine,
  currentPlan: Plan,
  taskWithPhases: PlanTask,
  config: FerixConfig,
  tui: DevMode,
  onEvent: (event: ClaudeEvent) => void,
  hasVerify: boolean
): Promise<VerifyLoopResult> {
  let plan = currentPlan;
  let task = taskWithPhases;
  let verifyAttempt = 1;
  let verifyError: WorkerOptions["verifyError"] | undefined;

  while (verifyAttempt <= MAX_VERIFY_ATTEMPTS) {
    const iterResult = await executeWorkerVerifyIterationTui(
      engine,
      plan,
      task,
      config,
      tui,
      onEvent,
      verifyAttempt,
      verifyError,
      hasVerify
    );

    plan = iterResult.plan;
    task = iterResult.task;

    if (iterResult.fatalError) {
      return { plan, task, fatalError: iterResult.fatalError };
    }

    if (!iterResult.continueLoop) {
      break;
    }

    verifyAttempt++;
    verifyError = iterResult.verifyError;
  }

  return { plan, task };
}

/**
 * Result of a worker + verify iteration
 */
interface WorkerVerifyIterationResult {
  /** Whether to continue the verify loop */
  continueLoop: boolean;
  /** Updated plan after worker execution */
  plan: Plan;
  /** Updated task after worker execution */
  task: PlanTask;
  /** Error to display if max attempts reached */
  fatalError?: string;
  /** Error context for next retry */
  verifyError?: WorkerOptions["verifyError"];
}

/**
 * Executes a single worker + verify iteration in TUI mode.
 *
 * @returns Result indicating whether to continue the loop
 */
async function executeWorkerVerifyIterationTui(
  engine: Engine,
  currentPlan: Plan,
  taskWithPhases: PlanTask,
  config: FerixConfig,
  tui: DevMode,
  onEvent: (event: ClaudeEvent) => void,
  verifyAttempt: number,
  verifyError: WorkerOptions["verifyError"] | undefined,
  hasVerify: boolean
): Promise<WorkerVerifyIterationResult> {
  // Execute the task
  tui.setExecutionMode("working", taskWithPhases.id);
  const workerOptions: WorkerOptions | undefined = verifyError
    ? { verifyError, verifyAttempt }
    : undefined;

  const workerResult = await executeWorker(
    engine,
    currentPlan,
    taskWithPhases,
    config,
    tui,
    onEvent,
    workerOptions
  );
  const workerCheck = checkResult(workerResult);

  if (workerCheck.failed) {
    return {
      continueLoop: false,
      plan: currentPlan,
      task: taskWithPhases,
      fatalError: workerCheck.error ?? "Worker failed",
    };
  }

  // Reload plan after worker
  const updatedPlan = loadPlan();
  const updatedTask =
    updatedPlan.tasks.find((t) => t.id === taskWithPhases.id) ?? taskWithPhases;

  // Run verify commands if configured
  if (!hasVerify) {
    return { continueLoop: false, plan: updatedPlan, task: updatedTask };
  }

  const verifyResult = await runVerifyPhase(config, tui, verifyAttempt);

  if (verifyResult.success) {
    return { continueLoop: false, plan: updatedPlan, task: updatedTask };
  }

  // Verify failed - check if we can retry
  const nextAttempt = verifyAttempt + 1;
  if (nextAttempt > MAX_VERIFY_ATTEMPTS) {
    const errorMsg = verifyResult.error
      ? `\n\nFailed command: ${verifyResult.error.command}\nExit code: ${verifyResult.error.exitCode}\n\nOutput:\n${verifyResult.error.output}`
      : "";
    return {
      continueLoop: false,
      plan: updatedPlan,
      task: updatedTask,
      fatalError: `Task ${taskWithPhases.id} failed after ${MAX_VERIFY_ATTEMPTS} verification attempts.${errorMsg}`,
    };
  }

  // Continue with retry
  tui.addOutput(
    `\n${colors.yellow}[VERIFY RETRY]${colors.reset} Retrying task ${taskWithPhases.id} (verify attempt ${nextAttempt}/${MAX_VERIFY_ATTEMPTS})\n`
  );

  return {
    continueLoop: true,
    plan: updatedPlan,
    task: updatedTask,
    verifyError: verifyResult.error,
  };
}

/**
 * Executes a single worker + verify iteration in standard mode.
 *
 * @returns Result indicating whether to continue the loop
 */
async function executeWorkerVerifyIterationStandard(
  engine: Engine,
  currentPlan: Plan,
  currentTask: PlanTask,
  taskId: number,
  config: FerixConfig,
  verifyAttempt: number,
  verifyError: WorkerOptions["verifyError"] | undefined,
  hasVerify: boolean,
  reviewAttemptNumber: number
): Promise<WorkerVerifyIterationResult> {
  const isVerifyRetry = verifyAttempt > 1;
  logger.info(
    `--- Executing (attempt ${reviewAttemptNumber}/${MAX_REVIEW_ATTEMPTS}${isVerifyRetry ? `, verify retry ${verifyAttempt}/${MAX_VERIFY_ATTEMPTS}` : ""}) ---`
  );

  const workerOptions: WorkerOptions | undefined = verifyError
    ? { verifyError, verifyAttempt }
    : undefined;

  const workerResult = await executeWorker(
    engine,
    currentPlan,
    currentTask,
    config,
    null,
    undefined,
    workerOptions
  );
  const workerCheck = checkResult(workerResult);

  if (workerCheck.failed) {
    throw new AgentError("Worker", workerCheck.error || "Failed");
  }

  const updatedPlan = loadPlan();
  const updatedTask =
    updatedPlan.tasks.find((t) => t.id === taskId) ?? currentTask;

  // Run verify commands if configured
  if (!hasVerify) {
    return { continueLoop: false, plan: updatedPlan, task: updatedTask };
  }

  const verifyResult = await runVerifyPhaseStandard(config, verifyAttempt);

  if (verifyResult.success) {
    return { continueLoop: false, plan: updatedPlan, task: updatedTask };
  }

  // Verify failed - check if we can retry
  const nextAttempt = verifyAttempt + 1;
  if (nextAttempt > MAX_VERIFY_ATTEMPTS) {
    const errorMsg = verifyResult.error
      ? `\n\nFailed command: ${verifyResult.error.command}\nExit code: ${verifyResult.error.exitCode}\n\nOutput:\n${verifyResult.error.output}`
      : "";
    throw new AgentError(
      "Verify",
      `Task ${taskId} failed after ${MAX_VERIFY_ATTEMPTS} verification attempts.${errorMsg}`
    );
  }

  // Continue with retry
  logger.warn(
    `Verify failed. Retrying task ${taskId} (verify attempt ${nextAttempt}/${MAX_VERIFY_ATTEMPTS})`
  );

  return {
    continueLoop: true,
    plan: updatedPlan,
    task: updatedTask,
    verifyError: verifyResult.error,
  };
}

/**
 * Executes a single task (planner + worker + verify + reviewer phases) in TUI mode.
 *
 * This is the core of the planner/worker/verify/reviewer loop:
 * 1. Run planner to break task into phases
 * 2. Reload plan to get phases
 * 3. Run worker to execute phases (with verify error context on retry)
 * 4. Run verify commands if configured
 * 5. If verify fails, retry worker (up to MAX_VERIFY_ATTEMPTS)
 * 6. Run reviewer to verify success criteria (if task has criteria)
 * 7. If review fails, retry worker (up to MAX_REVIEW_ATTEMPTS)
 * 8. Reload and return updated plan
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan
 * @param task - Task to execute
 * @param config - Ferix configuration
 * @param tui - DevMode TUI instance
 * @param onEvent - Event handler for TUI updates
 * @returns Updated plan after task completion
 * @throws AgentError if planner, worker, or reviewer fails after max attempts
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

  // Phase B + Verify + C: Execute task, verify, and review with retry loops
  const hasCriteria = taskHasCriteria(taskWithPhases);
  const hasVerify = config.verify.length > 0;
  let reviewAttemptNumber = (taskWithPhases.attempts ?? 0) + 1;

  while (reviewAttemptNumber <= MAX_REVIEW_ATTEMPTS) {
    // Phase B + Verify: Execute the task with verify retry loop
    const verifyLoopResult = await executeVerifyLoopTui(
      engine,
      currentPlan,
      taskWithPhases,
      config,
      tui,
      onEvent,
      hasVerify
    );

    currentPlan = verifyLoopResult.plan;
    taskWithPhases = verifyLoopResult.task;

    if (verifyLoopResult.fatalError) {
      return handleTuiError(tui, verifyLoopResult.fatalError);
    }

    // Phase C: Review if task has criteria
    if (!hasCriteria) {
      return currentPlan;
    }

    tui.setExecutionMode("reviewing", task.id);
    const reviewResult = await executeReviewer(
      engine,
      currentPlan,
      taskWithPhases,
      reviewAttemptNumber,
      tui,
      onEvent
    );

    // Reload plan after review (reviewer updates criteria statuses)
    currentPlan = loadPlan();
    taskWithPhases =
      currentPlan.tasks.find((t) => t.id === task.id) ?? taskWithPhases;

    if (reviewResult.passed) {
      tui.addOutput(
        `\n${colors.green}[REVIEW PASSED]${colors.reset} All criteria verified for task ${task.id}\n`
      );
      return currentPlan;
    }

    // Review failed - check if we can retry
    reviewAttemptNumber++;

    if (reviewAttemptNumber > MAX_REVIEW_ATTEMPTS) {
      const failedCriteria =
        taskWithPhases.criteria?.filter((c) => c.status === "failed") ?? [];
      const failedList = failedCriteria
        .map((c) => `  - ${c.description}: ${c.failureReason ?? "Unknown"}`)
        .join("\n");

      return handleTuiError(
        tui,
        `Task ${task.id} failed after ${MAX_REVIEW_ATTEMPTS} attempts.\n\nFailed criteria:\n${failedList}`
      );
    }

    tui.addOutput(
      `\n${colors.yellow}[REVIEW FAILED]${colors.reset} Retrying task ${task.id} (attempt ${reviewAttemptNumber}/${MAX_REVIEW_ATTEMPTS})\n`
    );
  }

  return currentPlan;
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
 * Executes worker + verify + review loop for a task in standard mode.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan
 * @param task - Task to execute (with phases)
 * @param config - Ferix configuration
 * @returns Updated plan after task completion
 * @throws AgentError if worker, verify, or reviewer fails after max attempts
 */
async function executeTaskStandard(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  config: FerixConfig
): Promise<Plan> {
  let currentPlan = plan;
  let currentTask = task;

  const hasCriteria = taskHasCriteria(currentTask);
  const hasVerify = config.verify.length > 0;
  let reviewAttemptNumber = (currentTask.attempts ?? 0) + 1;

  while (reviewAttemptNumber <= MAX_REVIEW_ATTEMPTS) {
    // Phase B + Verify: Execute the task with verify retry loop
    let verifyAttempt = 1;
    let verifyError: WorkerOptions["verifyError"] | undefined;

    while (verifyAttempt <= MAX_VERIFY_ATTEMPTS) {
      const iterResult = await executeWorkerVerifyIterationStandard(
        engine,
        currentPlan,
        currentTask,
        task.id,
        config,
        verifyAttempt,
        verifyError,
        hasVerify,
        reviewAttemptNumber
      );

      currentPlan = iterResult.plan;
      currentTask = iterResult.task;

      if (!iterResult.continueLoop) {
        break;
      }

      verifyAttempt++;
      verifyError = iterResult.verifyError;
    }

    // Phase C: Review if task has criteria
    if (!hasCriteria) {
      return currentPlan;
    }

    logger.info(
      `--- Reviewing (attempt ${reviewAttemptNumber}/${MAX_REVIEW_ATTEMPTS}) ---`
    );
    const reviewResult = await executeReviewer(
      engine,
      currentPlan,
      currentTask,
      reviewAttemptNumber,
      null
    );

    currentPlan = loadPlan();
    currentTask =
      currentPlan.tasks.find((t) => t.id === task.id) ?? currentTask;

    if (reviewResult.passed) {
      logger.success(`All criteria verified for task ${task.id}`);
      return currentPlan;
    }

    reviewAttemptNumber++;

    if (reviewAttemptNumber > MAX_REVIEW_ATTEMPTS) {
      const failedCriteria =
        currentTask.criteria?.filter((c) => c.status === "failed") ?? [];
      const failedList = failedCriteria
        .map((c) => `  - ${c.description}: ${c.failureReason ?? "Unknown"}`)
        .join("\n");

      throw new AgentError(
        "Review",
        `Task ${task.id} failed after ${MAX_REVIEW_ATTEMPTS} attempts.\n\nFailed criteria:\n${failedList}`
      );
    }

    logger.warn(
      `Review failed. Retrying task ${task.id} (attempt ${reviewAttemptNumber}/${MAX_REVIEW_ATTEMPTS})`
    );
  }

  return currentPlan;
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
