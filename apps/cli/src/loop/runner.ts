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
 * @returns Execution result
 */
function executeWorker(
  engine: Engine,
  plan: Plan,
  task: PlanTask,
  config: FerixConfig,
  tui: DevMode | null,
  onEvent?: (event: ClaudeEvent) => void
): Promise<ExecuteResult> {
  const prompt = createWorkerPrompt(plan, task, config.verify, config.branch);

  if (tui) {
    tui.addOutput(
      `\n${colors.cyan}[WORKING]${colors.reset} Task ${task.id}: ${task.title}\n`
    );
  } else {
    logger.info(`Executing task ${task.id}: ${task.title}`);
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
 * Executes a single task (planner + worker + reviewer phases) in TUI mode.
 *
 * This is the core of the planner/worker/reviewer loop:
 * 1. Run planner to break task into phases
 * 2. Reload plan to get phases
 * 3. Run worker to execute phases
 * 4. Run reviewer to verify success criteria (if task has criteria)
 * 5. If review fails, retry worker (up to MAX_REVIEW_ATTEMPTS)
 * 6. Reload and return updated plan
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

  // Phase B + C: Execute task and review with retry loop
  const hasCriteria = taskHasCriteria(taskWithPhases);
  let attemptNumber = (taskWithPhases.attempts ?? 0) + 1;

  while (attemptNumber <= MAX_REVIEW_ATTEMPTS) {
    // Phase B: Execute the task
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

    // Phase C: Review if task has criteria
    if (!hasCriteria) {
      // No criteria to verify - task is complete
      return currentPlan;
    }

    tui.setExecutionMode("reviewing", task.id);
    const reviewResult = await executeReviewer(
      engine,
      currentPlan,
      taskWithPhases,
      attemptNumber,
      tui,
      onEvent
    );

    // Reload plan after review (reviewer updates criteria statuses)
    currentPlan = loadPlan();
    taskWithPhases =
      currentPlan.tasks.find((t) => t.id === task.id) ?? taskWithPhases;

    if (reviewResult.passed) {
      // All criteria passed - task is complete
      tui.addOutput(
        `\n${colors.green}[REVIEW PASSED]${colors.reset} All criteria verified for task ${task.id}\n`
      );
      return currentPlan;
    }

    // Review failed - check if we can retry
    attemptNumber++;

    if (attemptNumber > MAX_REVIEW_ATTEMPTS) {
      // Max attempts reached - fail the task
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

    // Log retry
    tui.addOutput(
      `\n${colors.yellow}[REVIEW FAILED]${colors.reset} Retrying task ${task.id} (attempt ${attemptNumber}/${MAX_REVIEW_ATTEMPTS})\n`
    );
  }

  // This should never be reached, but TypeScript needs it
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
 * Executes worker + review loop for a task in standard mode.
 *
 * @param engine - LLM engine instance
 * @param plan - Current plan
 * @param task - Task to execute (with phases)
 * @param config - Ferix configuration
 * @returns Updated plan after task completion
 * @throws AgentError if worker or reviewer fails after max attempts
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
  let attemptNumber = (currentTask.attempts ?? 0) + 1;

  while (attemptNumber <= MAX_REVIEW_ATTEMPTS) {
    // Phase B: Execute the task
    logger.info(
      `--- Executing (attempt ${attemptNumber}/${MAX_REVIEW_ATTEMPTS}) ---`
    );
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

    currentPlan = loadPlan();
    currentTask =
      currentPlan.tasks.find((t) => t.id === task.id) ?? currentTask;

    // Phase C: Review if task has criteria
    if (!hasCriteria) {
      return currentPlan;
    }

    logger.info(
      `--- Reviewing (attempt ${attemptNumber}/${MAX_REVIEW_ATTEMPTS}) ---`
    );
    const reviewResult = await executeReviewer(
      engine,
      currentPlan,
      currentTask,
      attemptNumber,
      null
    );

    currentPlan = loadPlan();
    currentTask =
      currentPlan.tasks.find((t) => t.id === task.id) ?? currentTask;

    if (reviewResult.passed) {
      logger.success(`All criteria verified for task ${task.id}`);
      return currentPlan;
    }

    attemptNumber++;

    if (attemptNumber > MAX_REVIEW_ATTEMPTS) {
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
      `Review failed. Retrying task ${task.id} (attempt ${attemptNumber}/${MAX_REVIEW_ATTEMPTS})`
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
