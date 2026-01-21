import { MESSAGES } from "../constants.js";
import type { ClaudeEvent, Engine } from "../engine/index.js";
import { getEngine } from "../engine/index.js";
import {
  createBranch,
  createPullRequest,
  getCurrentBranch,
  pushBranch,
} from "../git/index.js";
import { composePrompt } from "../prompt/composer.js";
import { colors } from "../tui/ansi.js";
import { DevMode } from "../tui/dev-mode.js";
import {
  AgentError,
  DependencyError,
  ExecutionError,
} from "../types/errors.js";
import type { ExecuteResult, FerixConfig } from "../types.js";
import { logger } from "../utils/logger.js";
import { initProgress } from "./progress.js";

/**
 * Setup git branch if configured
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
 * Handle post-loop git operations (push and PR)
 * Returns the PR URL if a PR was created
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
 * Parse error type from error message
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
 * Process a single iteration result (non-TUI mode)
 * Returns true if should continue, false if complete
 * Throws on error
 */
function processIterationResult(
  result: ExecuteResult,
  iteration: number
): boolean {
  if (result.hasError && result.errorMessage) {
    const { type, message } = parseErrorType(result.errorMessage);
    throw new AgentError(type, message);
  }

  if (result.complete) {
    logger.success(`All tasks complete after ${iteration} iteration(s)`);
    return false;
  }

  if (!result.success) {
    throw new ExecutionError("Iteration failed");
  }

  return true;
}

/**
 * Execute the main loop in standard mode (no TUI)
 */
async function executeLoopStandard(
  engine: Engine,
  prompt: string,
  config: FerixConfig
): Promise<void> {
  const maxIterations = config.untilComplete
    ? Number.POSITIVE_INFINITY
    : config.iterations;
  const displayMax = config.untilComplete ? "∞" : config.iterations;

  for (let i = 1; i <= maxIterations; i++) {
    logger.iteration(i, displayMax);

    const result: ExecuteResult = await engine.execute(prompt);
    const shouldContinue = processIterationResult(result, i);

    if (!shouldContinue) {
      break;
    }

    if (i === maxIterations && !config.untilComplete) {
      logger.info(`Completed ${maxIterations} iteration(s)`);
    }
  }
}

/**
 * Create event handler for TUI updates
 */
function createTuiEventHandler(tui: DevMode): (event: ClaudeEvent) => void {
  return (event: ClaudeEvent) => handleTuiEvent(tui, event);
}

/**
 * Handle a single TUI event
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
    case "error":
      tui.setError();
      break;
    default:
      // "complete" event is handled after execute returns
      break;
  }
}

/**
 * Handle error result in TUI mode
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
 * Handle completion in TUI mode (including git operations)
 */
async function handleTuiComplete(
  tui: DevMode,
  iteration: number,
  config: FerixConfig
): Promise<void> {
  tui.setComplete();
  tui.addOutput(
    `\n${colors.green}[DONE]${colors.reset} All tasks complete after ${iteration} iteration(s)`
  );

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
 * Execute the main loop in dev mode (full-screen TUI)
 */
async function executeLoopDevMode(
  engine: Engine,
  prompt: string,
  config: FerixConfig
): Promise<void> {
  const maxIterations = config.untilComplete
    ? Number.POSITIVE_INFINITY
    : config.iterations;
  const displayMax = config.untilComplete ? "~" : String(config.iterations);

  const tui = new DevMode(config.task, displayMax);
  tui.start();

  // Set initial git info - show current branch even if no new branch configured
  try {
    const currentBranch = await getCurrentBranch();
    tui.setGitInfo({
      branch: config.branch ?? currentBranch,
      baseBranch: config.baseBranch,
      pushed: false,
    });
  } catch {
    // Not in a git repo or git not available - that's fine
  }

  const onEvent = createTuiEventHandler(tui);

  try {
    for (let i = 1; i <= maxIterations; i++) {
      tui.setIteration(i);

      const result: ExecuteResult = await engine.execute(prompt, {
        onEvent,
        writeToStdout: false,
      });

      if (result.hasError && result.errorMessage) {
        await handleTuiError(tui, result.errorMessage);
      }

      if (result.complete) {
        await handleTuiComplete(tui, i, config);
        break;
      }

      if (!result.success) {
        tui.setError();
        tui.addOutput(`\n${colors.red}[ERROR]${colors.reset} Iteration failed`);
        tui.addOutput(`\n${colors.dim}Press Ctrl+C to exit${colors.reset}`);
        await tui.waitForExit();
        tui.cleanup();
        throw new ExecutionError("Iteration failed");
      }

      if (i === maxIterations && !config.untilComplete) {
        tui.addOutput(
          `\n${colors.dim}[INFO]${colors.reset} Completed ${maxIterations} iteration(s)`
        );
        tui.addOutput(`\n${colors.dim}Press Ctrl+C to exit${colors.reset}`);
        await tui.waitForExit();
      }
    }
  } finally {
    tui.cleanup();
  }
}

/**
 * Run the Ferix loop with the given configuration
 */
export async function runLoop(config: FerixConfig): Promise<void> {
  const prompt = composePrompt(config);

  // Show dry run if requested (before any side effects)
  if (config.dryRun) {
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
    // Dev mode handles post-loop operations internally to update TUI
    await executeLoopDevMode(engine, prompt, config);
  } else {
    await executeLoopStandard(engine, prompt, config);
    // Handle post-loop operations for standard mode
    await handlePostLoop(config);
    logger.success("Ferix loop finished");
  }
}
