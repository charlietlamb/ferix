import { Cause, Effect, Stream } from "effect";
import pc from "picocolors";
import type { DomainEvent } from "../../domain/events.js";
import type { Consumer } from "../types.js";

/**
 * Formats a domain event for console output.
 */
function formatEvent(event: DomainEvent): string | null {
  switch (event._tag) {
    case "LoopStarted":
      return pc.cyan(`[LOOP] Started - ${event.config.task.slice(0, 50)}...`);

    case "LoopCompleted":
      return pc.green(
        `[LOOP] Completed in ${event.summary.durationMs}ms (${event.summary.iterations} iterations)`
      );

    case "LoopFailed":
      return pc.red(`[LOOP] Failed: ${event.error.message}`);

    case "IterationStarted":
      return pc.blue(`[ITER ${event.iteration}] Started`);

    case "IterationCompleted":
      return pc.blue(`[ITER ${event.iteration}] Completed`);

    case "LLMText":
      return null;

    case "LLMToolStart":
      return pc.yellow(`[TOOL] ${event.tool}`);

    case "LLMToolUse":
      return null;

    case "LLMToolEnd":
      return null;

    case "TasksDefined":
      return pc.magenta(
        `[TASKS] Defined ${event.tasks.length} tasks: ${event.tasks.map((t) => t.title).join(", ")}`
      );

    case "PhasesDefined":
      return pc.magenta(
        `[PHASES] Task ${event.taskId}: ${event.phases.length} phases defined`
      );

    case "CriteriaDefined":
      return pc.magenta(
        `[CRITERIA] Task ${event.taskId}: ${event.criteria.length} criteria defined`
      );

    case "PhaseStarted":
      return pc.cyan(`[PHASE] Started: ${event.phaseId}`);

    case "PhaseCompleted":
      return pc.green(`[PHASE] Completed: ${event.phaseId}`);

    case "PhaseFailed":
      return pc.red(`[PHASE] Failed: ${event.phaseId} - ${event.reason}`);

    case "CriterionPassed":
      return pc.green(`[CHECK] Passed: ${event.criterionId}`);

    case "CriterionFailed":
      return pc.red(`[CHECK] Failed: ${event.criterionId} - ${event.reason}`);

    case "CheckPassed":
      return pc.green("[CHECK] All criteria passed");

    case "CheckFailed":
      return pc.red(
        `[CHECK] Failed criteria: ${event.failedCriteria.join(", ")}`
      );

    case "ReviewComplete":
      return pc.green(
        `[REVIEW] Complete${event.changesMade ? " (changes made)" : ""}`
      );

    case "TaskCompleted":
      return pc.green(`[TASK] Completed: ${event.taskId} - ${event.summary}`);

    case "PlanCreated":
      return pc.magenta(`[PLAN] Created: ${event.plan.id}`);

    case "PlanUpdated":
      return pc.magenta(`[PLAN] Updated: ${event.plan.id}`);

    default:
      return null;
  }
}

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
