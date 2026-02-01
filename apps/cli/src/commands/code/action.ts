import { Effect, Stream } from "effect";
import { humanId } from "human-id";
import {
  createHeadlessConsumer,
  createTUIConsumer,
} from "./consumers/index.js";
import type { ConsumerContext } from "./consumers/types.js";
import {
  createDaemonClient,
  type DaemonCommandError,
  type DaemonConnectionError,
  ensureDaemonRunning,
} from "./daemon/index.js";
import type { DomainEvent, LoopConfig } from "./domain/index.js";
import type { ConsumerType } from "./domain/schemas/program.js";

/**
 * Union of all possible errors from running via daemon.
 */
type RunError = DaemonConnectionError | DaemonCommandError;

/**
 * Generates a human-readable session ID with timestamp for uniqueness.
 * Same format as the session store uses.
 */
function generateSessionId(): string {
  const id = humanId({ separator: "-", capitalize: false });
  return `${id}-${Date.now()}`;
}

/**
 * Result from running the loop.
 * - "completed": Loop finished normally or user pressed Ctrl+C
 * - "back_to_launcher": User pressed Escape to go back to launcher
 */
export type MainResult = "completed" | "back_to_launcher";

/**
 * Options for running via the daemon.
 */
interface RunOptions {
  /**
   * Loop configuration.
   */
  readonly config: LoopConfig;

  /**
   * Consumer type for output.
   * - "tui": Full-screen terminal UI
   * - "headless": Simple console logging
   * - "none": No output (for programmatic use)
   *
   * @default "headless"
   */
  readonly consumer?: ConsumerType;

  /**
   * Optional callback for each domain event.
   * Called in addition to the selected consumer.
   */
  readonly onEvent?: (event: DomainEvent) => void;
}

/**
 * Run a session via the daemon.
 *
 * This is the core execution function. All sessions run through the daemon,
 * which manages the actual loop execution. The TUI/consumer is just a viewer
 * that can attach and detach from the daemon-managed session.
 *
 * The daemon is automatically started if not already running.
 *
 * @param options - Run options including config and consumer type
 * @returns Effect that completes when the consumer exits (session may continue in daemon)
 */
function runViaDaemon(
  options: RunOptions
): Effect.Effect<MainResult, RunError, never> {
  const { config, consumer: consumerType = "headless", onEvent } = options;

  return Effect.gen(function* () {
    // Ensure daemon is running, starting it if necessary
    yield* ensureDaemonRunning();

    // Generate session ID if not provided
    const sessionId = config.sessionId ?? generateSessionId();
    const configWithSession = { ...config, sessionId };

    // Connect to daemon
    const client = createDaemonClient();
    yield* client.connect();

    // Start session in daemon
    yield* client.startSession(sessionId, configWithSession);

    // Get event stream (filtered by our session)
    const eventStream = client
      .getEventStream(sessionId)
      .pipe(Stream.catchAll(() => Stream.empty));

    // Add optional event callback
    const eventsWithCallback = onEvent
      ? eventStream.pipe(
          Stream.tap((event) => Effect.sync(() => onEvent(event)))
        )
      : eventStream;

    // Create consumer context for daemon connection
    const context: ConsumerContext = {
      daemonClient: client,
      sessionId,
    };

    // Handle "none" consumer type
    if (consumerType === "none") {
      yield* eventsWithCallback.pipe(Stream.runDrain);
      yield* client.disconnect();
      return "completed" as MainResult;
    }

    // Create and run consumer
    const consumer =
      consumerType === "tui" ? createTUIConsumer() : createHeadlessConsumer();

    const result = yield* consumer.consume(eventsWithCallback, context);

    // Cleanup based on result
    if (result === "back_to_launcher") {
      // Session continues in daemon, we detached via consumer
      // Client should already be unsubscribed by consumer
      yield* client.disconnect();
    } else {
      // Completed normally
      yield* client.disconnect();
    }

    return result;
  });
}

/**
 * Main CLI entry point.
 *
 * All sessions run through the daemon. The TUI/consumer is a viewer that can
 * attach and detach from daemon-managed sessions. The daemon is automatically
 * started if not already running.
 *
 * Automatically selects TUI for TTY, headless otherwise.
 *
 * @param config - Loop configuration
 * @returns Promise that resolves with the result when the consumer exits
 * @throws Error if connection to daemon fails
 */
export function main(config: LoopConfig): Promise<MainResult> {
  const consumerType: ConsumerType = process.stdout.isTTY ? "tui" : "headless";

  return runViaDaemon({ config, consumer: consumerType }).pipe(
    Effect.catchTag("DaemonConnectionError", (err) => {
      console.error(`Failed to connect to daemon: ${err.message}`);
      return Effect.sync(() => process.exit(1));
    }),
    Effect.catchTag("DaemonCommandError", (err) => {
      console.error(`Daemon command failed: ${err.message}`);
      return Effect.sync(() => process.exit(1));
    }),
    Effect.runPromise
  );
}
