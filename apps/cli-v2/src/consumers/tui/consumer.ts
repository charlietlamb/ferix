import { Cause, Effect, Fiber, Ref, Stream } from "effect";
import type { DomainEvent } from "../../domain/index.js";
import type { Consumer } from "../types.js";
import { runInputLoop } from "./input.js";
import { ANSIOutput } from "./output/index.js";
import { appendError, createInitialState, reduce } from "./state.js";
import { safeRender } from "./utils.js";

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
 */
export function createTUIConsumer(): Consumer {
  return {
    consume: (events: Stream.Stream<DomainEvent, unknown, never>) =>
      Effect.gen(function* () {
        // Initialize state
        const stateRef = yield* Ref.make(createInitialState());
        const output = new ANSIOutput();

        // Cleanup function to restore terminal state
        const cleanup = () => {
          output.disableMouse();
          output.showCursor();
          output.exitAlternateBuffer();
        };

        // Setup terminal
        output.enterAlternateBuffer();
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

        // Process events stream
        const processEvents = events.pipe(
          Stream.runForEach((event) =>
            Effect.gen(function* () {
              const state = yield* Ref.updateAndGet(stateRef, (s) =>
                reduce(s, event)
              );
              yield* Effect.sync(() => safeRender(state, output));
            })
          )
        );

        // Track if Ctrl+C was pressed during event processing
        let ctrlCPressed = false;

        // Race event processing against input fiber (Ctrl+C exits immediately)
        // Use Either to determine which completed first
        yield* Effect.race(
          processEvents.pipe(Effect.as("events" as const)),
          Fiber.join(inputFiber).pipe(Effect.as("input" as const))
        ).pipe(
          Effect.tap((winner) =>
            Effect.sync(() => {
              if (winner === "input") {
                ctrlCPressed = true;
              }
            })
          ),
          Effect.catchAllCause((cause) => {
            // Skip interrupt-only causes (normal Ctrl+C exit)
            if (Cause.isInterruptedOnly(cause)) {
              ctrlCPressed = true;
              return Effect.void;
            }

            // Format the error verbosely and display in TUI
            const errorText = formatCauseVerbose(cause);

            // Update state with error and re-render
            return Effect.gen(function* () {
              const state = yield* Ref.updateAndGet(stateRef, (s) =>
                appendError(s, errorText)
              );
              yield* Effect.sync(() => safeRender(state, output));

              // Also log to stderr for visibility after TUI exits
              process.stderr.write(`\n${errorText}\n`);
            });
          })
        );

        // If events finished (not Ctrl+C), wait for user to press Ctrl+C
        // The input fiber handles Ctrl+C and interrupts itself
        // User can still scroll, change views, etc. while waiting
        if (!ctrlCPressed) {
          yield* Fiber.join(inputFiber).pipe(
            Effect.catchAllCause((cause) => {
              // Ignore interrupt (expected from Ctrl+C)
              if (Cause.isInterruptedOnly(cause)) {
                return Effect.void;
              }
              // Ignore other errors from input
              return Effect.void;
            })
          );
        }

        // Cleanup terminal state
        unsubscribeResize();
        cleanup();
      }),
  };
}
