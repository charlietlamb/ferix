import { Effect } from "effect";
import { main } from "./action.js";
import {
  createLauncherConsumer,
  createSessionViewConsumer,
} from "./consumers/launcher/index.js";
import { ensureDaemonRunning } from "./daemon/index.js";
import type { LoopConfig, ProviderName } from "./domain/index.js";

/**
 * Options passed from the CLI to the launcher.
 */
export interface LauncherOptions {
  readonly iterations: string;
  readonly verify?: string[];
  readonly branch?: string;
  readonly push?: boolean;
  readonly pr?: boolean;
  readonly provider: string;
  readonly yolo: boolean;
  readonly debug?: boolean;
}

/**
 * Build LoopConfig from options and task.
 */
function buildConfig(options: LauncherOptions, task: string): LoopConfig {
  return {
    task,
    maxIterations: Number.parseInt(options.iterations, 10),
    verifyCommands: options.verify ?? [],
    branch: options.branch,
    push: options.push,
    pr: options.pr,
    provider: options.provider as ProviderName,
    yolo: options.yolo ?? true,
    debug: options.debug,
  };
}

/**
 * Run a session and return whether to continue to launcher.
 * Returns true if user pressed Escape (go to launcher), false to exit.
 */
async function runSession(
  options: LauncherOptions,
  task: string
): Promise<boolean> {
  const config = buildConfig(options, task);
  const result = await main(config);
  return result === "back_to_launcher";
}

/**
 * Launch the session selector TUI.
 *
 * When called without an initialTask, this function displays an interactive
 * TUI that allows users to:
 * - Browse existing sessions
 * - Select a session to view its details (with Escape to return)
 * - Create a new session with inline task input
 *
 * When called with an initialTask, it runs that session first, then falls
 * through to the launcher if the user presses Escape.
 *
 * The launcher loops between the session list and session view until
 * the user either quits (Ctrl+C) or completes a session normally.
 */
export async function launchSelector(
  options: LauncherOptions,
  initialTask?: string
): Promise<void> {
  // Require TTY for the launcher
  if (!process.stdout.isTTY) {
    console.error(
      'Session selector requires a TTY. Provide a task: ferix "your task"'
    );
    process.exit(1);
  }

  // Ensure daemon is running before entering the TUI
  await Effect.runPromise(ensureDaemonRunning());

  // If initial task provided, run it first
  if (initialTask) {
    const goToLauncher = await runSession(options, initialTask);
    if (!goToLauncher) {
      return;
    }
    // Fall through to launcher loop
  }

  // Track selected index to preserve position when returning from session view
  let selectedIndex = 0;

  // Loop between launcher and session view
  while (true) {
    const launcher = createLauncherConsumer({
      initialSelectedIndex: selectedIndex,
    });
    const result = await Effect.runPromise(launcher.run());

    switch (result.type) {
      case "quit":
        process.exit(0);
        break;

      case "select": {
        // Remember the selected index for when we return
        selectedIndex = result.selectedIndex;

        // Show session view, return to launcher on "back"
        const viewConsumer = createSessionViewConsumer(result.sessionId);
        const viewResult = await Effect.runPromise(viewConsumer.run());

        if (viewResult === "quit") {
          process.exit(0);
        }
        // viewResult === "back" -> continue loop to show launcher again
        break;
      }

      case "new": {
        // Start new session
        const goToLauncher = await runSession(options, result.task);

        // If user pressed Escape, go back to launcher
        if (goToLauncher) {
          // Reset to top of list since this was a new session
          selectedIndex = 0;
          break;
        }

        // Otherwise (completed or quit), exit
        return;
      }

      default:
        break;
    }
  }
}
