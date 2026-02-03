import { Effect } from "effect";
import { main } from "./action.js";
import { type Route, tui } from "./consumers/tui/index.js";
import { createDaemonClient, ensureDaemonRunning } from "./daemon/index.js";
import type { ProviderName } from "./domain/index.js";

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
 * Normalized options for the TUI.
 * These are the values that the TUI will use.
 */
interface NormalizedOptions {
  readonly maxIterations: number;
  readonly verifyCommands: string[];
  readonly branch?: string;
  readonly push?: boolean;
  readonly pr?: boolean;
  readonly provider: ProviderName;
  readonly yolo: boolean;
  readonly debug: boolean;
}

/**
 * Normalize options from CLI format to TUI format.
 */
function normalizeOptions(options: LauncherOptions): NormalizedOptions {
  return {
    maxIterations: Number.parseInt(options.iterations, 10),
    verifyCommands: options.verify ?? [],
    branch: options.branch,
    push: options.push,
    pr: options.pr,
    provider: options.provider as ProviderName,
    yolo: options.yolo ?? true,
    debug: options.debug ?? false,
  };
}

/**
 * Launch the TUI.
 *
 * This function:
 * 1. Ensures the daemon is running
 * 2. Connects to the daemon
 * 3. Starts the TUI with the appropriate initial route
 *
 * If an initialTask is provided, the TUI starts with a new session.
 * Otherwise, it starts with the session launcher/selector.
 *
 * The TUI handles all navigation internally (launcher <-> session views).
 * The user exits via Ctrl+C.
 *
 * @param options - CLI options for the session
 * @param initialTask - Optional task to start a new session with
 */
export async function launchSelector(
  options: LauncherOptions,
  initialTask?: string
): Promise<void> {
  // Non-TTY: run headless via action.ts
  if (!process.stdout.isTTY) {
    if (!initialTask) {
      console.error('Non-TTY mode requires a task. Usage: ferix "your task"');
      process.exit(1);
    }
    const normalized = normalizeOptions(options);
    await main({
      task: initialTask,
      maxIterations: normalized.maxIterations,
      verifyCommands: normalized.verifyCommands,
      branch: normalized.branch,
      push: normalized.push,
      pr: normalized.pr,
      provider: normalized.provider,
      yolo: normalized.yolo,
      debug: normalized.debug,
    });
    return;
  }

  // Ensure daemon is running before entering the TUI
  await Effect.runPromise(ensureDaemonRunning());

  // Create and connect daemon client
  const client = createDaemonClient();
  await Effect.runPromise(
    client.connect().pipe(
      Effect.catchAll((err) => {
        console.error("Failed to connect to daemon:", err.message);
        return Effect.sync(() => process.exit(1));
      })
    )
  );

  // Normalize options
  const _normalized = normalizeOptions(options);

  // Determine initial route
  let initialRoute: Route | undefined;
  if (initialTask) {
    // Start with a new session
    initialRoute = { type: "new", task: initialTask };
  }
  // Otherwise, default to launcher (undefined -> launcher route)

  // Start the TUI
  await tui({
    daemonClient: client,
    initialRoute,
    onExit: async () => {
      // Disconnect from daemon on exit
      await Effect.runPromise(client.disconnect().pipe(Effect.ignore));
    },
  });
}
