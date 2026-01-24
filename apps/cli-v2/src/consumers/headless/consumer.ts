import { Cause, Effect, Stream } from "effect";
import pc from "picocolors";
import type { DomainEvent } from "../../domain/events.js";
import type { Consumer } from "../types.js";
import { formatEvent } from "./formatters/index.js";

/**
 * Format an error (Error object or unknown) into lines for display.
 */
function formatErrorToLines(err: unknown, lines: string[]): void {
  if (err instanceof Error) {
    lines.push(pc.red(`  - ${err.name}: ${err.message}`));
    if (err.stack) {
      lines.push("");
      lines.push(pc.yellow("Stack trace:"));
      for (const stackLine of err.stack.split("\n").slice(1)) {
        lines.push(pc.dim(`  ${stackLine.trim()}`));
      }
    }
  } else {
    lines.push(pc.red(`  - ${String(err)}`));
  }
}

/**
 * Format a Cause into a verbose, human-readable error string for headless output.
 */
function formatCauseVerbose(cause: Cause.Cause<unknown>): string {
  const lines: string[] = [];
  const separator = pc.red(
    "═══════════════════════════════════════════════════════════════"
  );
  const causeType = Cause.isFailure(cause) ? "Failure" : "Other";

  lines.push("");
  lines.push(separator);
  lines.push(pc.red("                           ERROR"));
  lines.push(separator);
  lines.push("");
  lines.push(`${pc.yellow("Type:")} ${causeType}`);
  lines.push("");
  lines.push(pc.yellow("Details:"));
  lines.push(Cause.pretty(cause));

  const failures = Cause.failures(cause);
  if (failures.length > 0) {
    lines.push("");
    lines.push(pc.yellow("Failures:"));
    for (const failure of failures) {
      formatErrorToLines(failure, lines);
    }
  }

  const defects = Cause.defects(cause);
  if (defects.length > 0) {
    lines.push("");
    lines.push(pc.yellow("Defects (unexpected errors):"));
    for (const defect of defects) {
      formatErrorToLines(defect, lines);
    }
  }

  lines.push("");
  lines.push(separator);
  lines.push("");

  return lines.join("\n");
}

/**
 * Creates a headless consumer that logs events to the console.
 *
 * This consumer is suitable for CI environments or piped output.
 * It formats events as colored log lines.
 *
 * @returns A Consumer that logs to stdout
 *
 * @example
 * ```typescript
 * const consumer = createHeadlessConsumer();
 * const events = runLoop(config).pipe(Stream.provideLayer(layers));
 * await consumer.consume(events).pipe(Effect.runPromise);
 * ```
 */
export function createHeadlessConsumer(): Consumer {
  return {
    consume: (events: Stream.Stream<DomainEvent, unknown, never>) =>
      events
        .pipe(
          Stream.runForEach((event) =>
            Effect.sync(() => {
              const formatted = formatEvent(event);
              if (formatted) {
                console.log(formatted);
              }

              if (event._tag === "LLMText" && event.text) {
                process.stdout.write(event.text);
              }
            })
          )
        )
        .pipe(
          Effect.catchAllCause((cause) => {
            // Skip interrupt-only causes (normal Ctrl+C exit)
            if (Cause.isInterruptedOnly(cause)) {
              return Effect.void;
            }

            // Format and print the error verbosely
            const errorText = formatCauseVerbose(cause);
            console.error(errorText);

            return Effect.void;
          })
        ),
  };
}

export type {
  EventFormatter,
  HeadlessFormatterRegistry,
} from "./formatters/index.js";
// Re-export for backwards compatibility
export { formatEvent, headlessFormatterRegistry } from "./formatters/index.js";
