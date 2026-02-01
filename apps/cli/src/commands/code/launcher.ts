import { Effect } from "effect";
import { main } from "./action.js";
import {
  createLauncherConsumer,
  createSessionViewConsumer,
} from "./consumers/launcher/index.js";
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
 * Launch the session selector TUI.
 *
 * When called without a task argument, this function displays an interactive
 * TUI that allows users to:
 * - Browse existing sessions
 * - Select a session to view its details (with Escape to return)
 * - Create a new session with inline task input
 *
 * The launcher loops between the session list and session view until
 * the user either quits (Ctrl+C) or creates a new session.
 */
export async function launchSelector(options: LauncherOptions): Promise<void> {
  // Require TTY for the launcher
  if (!process.stdout.isTTY) {
    console.error(
      'Session selector requires a TTY. Provide a task: ferix "your task"'
    );
    process.exit(1);
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
        const config: LoopConfig = {
          task: result.task,
          maxIterations: Number.parseInt(options.iterations, 10),
          verifyCommands: options.verify ?? [],
          branch: options.branch,
          push: options.push,
          pr: options.pr,
          provider: options.provider as ProviderName,
          yolo: options.yolo ?? true,
          debug: options.debug,
        };
        const mainResult = await main(config);

        // If user pressed Escape, go back to launcher
        if (mainResult === "back_to_launcher") {
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
