import { Cause, Effect, Fiber, Ref, Stream } from "effect";
import type { DomainEvent } from "../../domain/index.js";
import type { ConsumeResult, Consumer, ConsumerContext } from "../types.js";
import { BackToLauncherSignal, runInputLoop } from "./input.js";
import { ANSIOutput } from "./output/index.js";
import { appendError, createInitialState, reduce } from "./state.js";
import { safeRender } from "./utils.js";

/** Global reference for emergency cleanup on SIGINT */
let activeOutput: ANSIOutput | null = null;

function setupSignalHandlers(): () => void {
  const handler = () => {
    if (activeOutput) {
      activeOutput.fullCleanup();
      if (process.stdin.isTTY) {
        try {
          process.stdin.setRawMode(false);
        } catch {
          // stdin may already be closed
        }
      }
      activeOutput = null;
    }
    process.removeListener("SIGINT", handler);
    process.kill(process.pid, "SIGINT");
  };

  process.on("SIGINT", handler);
  return () => process.removeListener("SIGINT", handler);
}

/** Interval for periodic clock refresh (1 second) */
const CLOCK_REFRESH_INTERVAL_MS = 1000;

/**
 * Format an error (Error object or unknown) into lines for display.
 */
function formatErrorToLines(err: unknown, lines: string[]): void {
  if (err instanceof Error) {
    lines.push(`  - ${err.name}: ${err.message}`);
    if (err.stack) {
      lines.push("");
      lines.push("Stack trace:");
      for (const stackLine of err.stack.split("\n").slice(1)) {
        lines.push(`  ${stackLine.trim()}`);
      }
    }
  } else {
    lines.push(`  - ${String(err)}`);
  }
}

/**
 * Format a Cause into a verbose, human-readable error string.
 */
function formatCauseVerbose(cause: Cause.Cause<unknown>): string {
  const lines: string[] = [];
  const causeType = Cause.isFailure(cause) ? "Failure" : "Other";

  lines.push(`Type: ${causeType}`);
  lines.push("");
  lines.push("Details:");
  lines.push(Cause.pretty(cause));

  const failures = Cause.failures(cause);
  if (failures.length > 0) {
    lines.push("");
    lines.push("Failures:");
    for (const failure of failures) {
      formatErrorToLines(failure, lines);
    }
  }

  const defects = Cause.defects(cause);
  if (defects.length > 0) {
    lines.push("");
    lines.push("Defects (unexpected errors):");
    for (const defect of defects) {
      formatErrorToLines(defect, lines);
    }
  }

  return lines.join("\n");
}

/**
 * Check if a cause contains a BackToLauncherSignal.
 */
function hasBackToLauncherSignal(cause: Cause.Cause<unknown>): boolean {
  const failures = Cause.failures(cause);
  for (const failure of failures) {
    if (failure instanceof BackToLauncherSignal) {
      return true;
    }
  }
  return false;
}

/**
 * Unsubscribe from daemon session if context is provided.
 */
function unsubscribeFromDaemon(
  context: ConsumerContext | undefined
): Effect.Effect<void, never, never> {
  if (!context) {
    return Effect.void;
  }
  return context.daemonClient
    .unsubscribeFromSession(context.sessionId)
    .pipe(Effect.ignore);
}

/**
 * Creates a TUI consumer that renders events to a full-screen terminal interface.
 *
 * The TUI provides:
 * - Header with task and iteration info
 * - Status bar with current phase, tool, and progress
 * - Three view modes: logs, tasks list, task detail
 * - Scrollable output area with ferix tag styling
 * - Keyboard navigation (vim-style j/k, g/G)
 * - Mouse wheel support
 * - Context-sensitive footer with keyboard hints
 *
 * When connected to a daemon (via context), pressing Escape detaches from the
 * session and returns to the launcher. The session continues running in the daemon.
 *
 * Uses ANSI escape codes for terminal control (alternate buffer, cursor hiding, etc).
 *
 * @returns A Consumer that renders to the terminal
 *
 * @example
 * ```typescript
 * const consumer = createTUIConsumer();
 * const events = runLoop(config).pipe(Stream.provideLayer(layers));
 * await consumer.consume(events).pipe(Effect.runPromise);
 * ```
 *
 * @example With daemon context (enables detach on Escape)
 * ```typescript
 * const consumer = createTUIConsumer();
 * const context = { daemonClient: client, sessionId: "session-123" };
 * await consumer.consume(eventStream, context).pipe(Effect.runPromise);
 * ```
 */
export function createTUIConsumer(): Consumer {
  return {
    consume: (
      events: Stream.Stream<DomainEvent, unknown, never>,
      context?: ConsumerContext
    ) =>
      Effect.gen(function* () {
        // Initialize state
        const stateRef = yield* Ref.make(createInitialState());
        const output = new ANSIOutput();

        // Register output for emergency cleanup by signal handlers
        activeOutput = output;

        // Setup signal handlers for emergency cleanup
        const removeSignalHandlers = setupSignalHandlers();

        // Cleanup function to restore terminal state
        const cleanup = () => {
          output.fullCleanup();
          activeOutput = null;
          removeSignalHandlers();
        };

        // Setup terminal - enter alternate buffer and clear it
        output.enterAlternateBuffer();
        output.clearScreen();
        output.cursorHome();
        output.hideCursor();
        output.enableMouse();

        // Subscribe to resize events
        const unsubscribeResize = output.onResize(() => {
          const state = Effect.runSync(Ref.get(stateRef));
          safeRender(state, output);
        });

        // Fork input handler for keyboard/mouse (as daemon so it doesn't affect parent)
        const inputFiber = yield* Effect.forkDaemon(
          runInputLoop(stateRef, output)
        );

        // Fork clock refresh timer (updates elapsed time display every second)
        const clockFiber = yield* Effect.forkDaemon(
          Effect.forever(
            Effect.gen(function* () {
              yield* Effect.sleep(CLOCK_REFRESH_INTERVAL_MS);
              const state = yield* Ref.get(stateRef);
              // Only refresh if still running (clock is visible)
              if (state.status === "running") {
                yield* Effect.sync(() => safeRender(state, output));
              }
            })
          )
        );

        // Fork event processing so we can interrupt it on detach
        const processingFiber = yield* Effect.fork(
          events.pipe(
            Stream.runForEach((event) =>
              Effect.gen(function* () {
                const state = yield* Ref.updateAndGet(stateRef, (s) =>
                  reduce(s, event)
                );
                yield* Effect.sync(() => safeRender(state, output));
              })
            )
          )
        );

        // Track exit reason
        let exitResult: ConsumeResult = "completed";

        // Wait for either:
        // 1. Event processing to complete (stream ends)
        // 2. User presses Escape (BackToLauncherSignal from input fiber)
        // 3. User presses Ctrl+C (interrupt from input fiber)
        //
        // We use raceFirst which does NOT interrupt the loser, so the input
        // fiber keeps running after events finish.
        type RaceResult =
          | { winner: "events" }
          | { winner: "input"; action: "back_to_launcher" | "quit" };

        const raceResult = yield* Effect.raceFirst(
          Fiber.join(processingFiber).pipe(
            Effect.map(() => ({ winner: "events" }) as RaceResult),
            Effect.catchAllCause((cause) => {
              // Event stream errors - display in TUI but don't exit
              if (!Cause.isInterruptedOnly(cause)) {
                const errorText = formatCauseVerbose(cause);
                Effect.runSync(
                  Ref.update(stateRef, (s) => appendError(s, errorText))
                );
                const state = Effect.runSync(Ref.get(stateRef));
                safeRender(state, output);
              }
              return Effect.succeed({ winner: "events" } as RaceResult);
            })
          ),
          Fiber.join(inputFiber).pipe(
            Effect.map(
              () => ({ winner: "input", action: "quit" }) as RaceResult
            ),
            Effect.catchAllCause((cause) => {
              // Check for BackToLauncherSignal
              if (hasBackToLauncherSignal(cause)) {
                return Effect.succeed({
                  winner: "input",
                  action: "back_to_launcher",
                } as RaceResult);
              }
              // Ctrl+C or other interrupt
              return Effect.succeed({
                winner: "input",
                action: "quit",
              } as RaceResult);
            })
          )
        );

        // Handle based on race result
        if (raceResult.winner === "input") {
          if (raceResult.action === "back_to_launcher") {
            exitResult = "back_to_launcher";
            // Interrupt event processing and unsubscribe from daemon
            yield* Fiber.interrupt(processingFiber).pipe(Effect.ignore);
            yield* unsubscribeFromDaemon(context);
          }
          // For "quit", exitResult stays "completed"
        } else {
          // Events finished - wait for user to press Escape or Ctrl+C
          // The input fiber is still running (raceFirst doesn't interrupt loser)
          yield* Fiber.join(inputFiber).pipe(
            Effect.catchAllCause((cause) => {
              // Check for BackToLauncherSignal
              if (hasBackToLauncherSignal(cause)) {
                exitResult = "back_to_launcher";
                return unsubscribeFromDaemon(context);
              }
              // Ignore interrupt (expected from Ctrl+C) and other errors
              return Effect.void;
            })
          );
        }

        // Cleanup: interrupt fibers and restore terminal state
        yield* Fiber.interrupt(clockFiber);
        yield* Fiber.interrupt(inputFiber).pipe(Effect.ignore);
        yield* Fiber.interrupt(processingFiber).pipe(Effect.ignore);
        unsubscribeResize();
        cleanup();

        return exitResult;
      }),
  };
}
