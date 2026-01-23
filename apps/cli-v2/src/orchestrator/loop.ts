import { Effect, Option, pipe, Ref, Stream } from "effect";
import type { LoopConfig, LoopSummary } from "../domain/config.js";
import { OrchestratorError } from "../domain/errors.js";
import type { DomainEvent } from "../domain/events.js";
import type { Plan } from "../domain/plan.js";
import type { Session } from "../domain/session.js";
import { LLM } from "../services/llm.js";
import { PlanStore } from "../services/plan-store.js";
import { SessionStore } from "../services/session-store.js";
import { SignalParser } from "../services/signal-parser.js";
import { createIterationStream } from "./iteration.js";

/**
 * Required services for the orchestrator.
 */
export type OrchestratorServices =
  | LLM
  | SignalParser
  | PlanStore
  | SessionStore;

/**
 * Run the ralph loop.
 *
 * Returns a Stream of DomainEvents that ANY consumer can subscribe to.
 * The orchestrator has NO knowledge of how events are consumed.
 *
 * @param config - Loop configuration
 * @returns Stream of domain events
 *
 * @example TUI consumption
 * ```typescript
 * const events = runLoop(config);
 * await events.pipe(
 *   Stream.runForEach((event) => tui.render(event)),
 *   Effect.provide(ProductionLayers),
 *   Effect.runPromise
 * );
 * ```
 *
 * @example Web consumption
 * ```typescript
 * const events = runLoop(config);
 * await events.pipe(
 *   Stream.runForEach((event) => websocket.send(JSON.stringify(event))),
 *   Effect.provide(ProductionLayers),
 *   Effect.runPromise
 * );
 * ```
 *
 * @example Collecting events for testing
 * ```typescript
 * const events = runLoop(config);
 * const collected = await events.pipe(
 *   Stream.runCollect,
 *   Effect.provide(TestLayers),
 *   Effect.runPromise
 * );
 * expect(collected).toContainEqual({ _tag: "LoopStarted", ... });
 * ```
 */
export function runLoop(
  config: LoopConfig
): Stream.Stream<DomainEvent, OrchestratorError, OrchestratorServices> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const llm = yield* LLM;
      const signalParser = yield* SignalParser;
      const sessionStore = yield* SessionStore;
      const planStore = yield* PlanStore;

      const session = yield* sessionStore.create(config.task).pipe(
        Effect.mapError(
          (e) =>
            new OrchestratorError({
              message: `Failed to create session: ${e.message}`,
              phase: "setup",
              cause: e,
            })
        )
      );

      const startTime = Date.now();

      // Use Effect Ref for mutable state instead of closure mutation
      const loopCompletedRef = yield* Ref.make(false);
      const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

      const maxIterations =
        config.maxIterations === 0
          ? Number.POSITIVE_INFINITY
          : config.maxIterations;

      const loopStarted: DomainEvent = { _tag: "LoopStarted", config };

      // Use unfoldEffect to create iterations with effectful termination condition
      const iterationsStream: Stream.Stream<
        DomainEvent,
        OrchestratorError,
        never
      > = Stream.unfoldEffect(1, (iteration: number) =>
        Effect.gen(function* () {
          // Check if we should continue
          const completed = yield* Ref.get(loopCompletedRef);
          if (completed || iteration > maxIterations) {
            return Option.none<readonly [number, number]>(); // Stop the stream
          }
          // Return the current iteration and the next state
          return Option.some([iteration, iteration + 1] as const);
        })
      ).pipe(
        Stream.flatMap((iteration: number) =>
          createIterationStream(
            llm,
            signalParser,
            planStore,
            currentPlanRef,
            loopCompletedRef,
            config,
            iteration,
            session.id
          )
        )
      );

      const completionStream = createCompletionStream(
        sessionStore,
        session,
        config,
        startTime,
        loopCompletedRef
      );

      return pipe(
        Stream.succeed(loopStarted),
        Stream.concat(iterationsStream),
        Stream.concat(completionStream)
      );
    })
  );
}

/**
 * Creates the completion stream that finalizes the loop.
 */
function createCompletionStream(
  sessionStore: {
    update: (id: string, session: Session) => Effect.Effect<void, unknown>;
  },
  session: Session,
  config: LoopConfig,
  startTime: number,
  loopCompletedRef: Ref.Ref<boolean>
): Stream.Stream<DomainEvent, never, never> {
  return Stream.fromEffect(
    Effect.gen(function* () {
      const durationMs = Date.now() - startTime;
      const completed = yield* Ref.get(loopCompletedRef);
      const summary: LoopSummary = {
        iterations: config.maxIterations,
        success: completed,
        sessionId: session.id,
        completedTasks: session.completedTasks,
        durationMs,
      };

      // Session update is best-effort - log failures but don't fail the loop
      // since the loop has already completed successfully
      yield* sessionStore
        .update(session.id, {
          ...session,
          status: completed ? "completed" : "paused",
        })
        .pipe(
          Effect.tapError((error) =>
            Effect.logDebug("Session update failed, continuing", {
              sessionId: session.id,
              error: String(error),
            })
          ),
          Effect.orElseSucceed(() => undefined)
        );

      const event: DomainEvent = { _tag: "LoopCompleted", summary };
      return event;
    })
  );
}
