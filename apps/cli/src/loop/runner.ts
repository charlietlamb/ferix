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
 */
async function handlePostLoop(config: FerixConfig): Promise<void> {
  if (!(config.push && config.branch)) {
    return;
  }

  await pushBranch(config.branch);

  if (config.pr && config.baseBranch) {
    await createPullRequest(config.baseBranch);
  }
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

  try {
    for (let i = 1; i <= maxIterations; i++) {
      tui.setIteration(i);

      // Create event handler for TUI updates
      const onEvent = (event: ClaudeEvent) => {
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
          case "complete":
            // Will be handled after execute returns
            break;
          case "error":
            tui.setError();
            break;
          default:
            // Unknown event type - ignore
            break;
        }
      };

      const result: ExecuteResult = await engine.execute(prompt, {
        onEvent,
        writeToStdout: false,
      });

      if (result.hasError && result.errorMessage) {
        tui.setError();
        tui.addOutput(
          `\n${colors.red}[ERROR]${colors.reset} ${result.errorMessage}`
        );
        tui.cleanup();
        const { type, message } = parseErrorType(result.errorMessage);
        throw new AgentError(type, message);
      }

      if (result.complete) {
        tui.setComplete();
        tui.addOutput(
          `\n${colors.green}[DONE]${colors.reset} All tasks complete after ${i} iteration(s)`
        );
        break;
      }

      if (!result.success) {
        tui.setError();
        tui.addOutput(`\n${colors.red}[ERROR]${colors.reset} Iteration failed`);
        tui.cleanup();
        throw new ExecutionError("Iteration failed");
      }

      if (i === maxIterations && !config.untilComplete) {
        tui.addOutput(
          `\n${colors.dim}[INFO]${colors.reset} Completed ${maxIterations} iteration(s)`
        );
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
    await executeLoopDevMode(engine, prompt, config);
  } else {
    await executeLoopStandard(engine, prompt, config);
  }

  await handlePostLoop(config);

  if (!useDevMode) {
    logger.success("Ferix loop finished");
  }
}
