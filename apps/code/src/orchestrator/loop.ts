import { DateTime, Effect, Option, pipe, Ref, Stream } from "effect";
import { OrchestratorError } from "../domain/errors.js";
import type {
  DomainEvent,
  LoopConfig,
  LoopSummary,
  Plan,
  Session,
} from "../domain/index.js";
import { LLM } from "../services/llm.js";
import { PlanStore } from "../services/plan-store.js";
import { SessionStore } from "../services/session-store.js";
import { SignalParser } from "../services/signal-parser.js";
import { createDiscoveryStream } from "./discovery.js";
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
): Stream.Stream<DomainEvent, never, OrchestratorServices> {
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

      const startTimeUtc = yield* DateTime.now;
      const startTime = DateTime.toEpochMillis(startTimeUtc);

      // Use Effect Ref for mutable state instead of closure mutation
      const loopCompletedRef = yield* Ref.make(false);
      const currentPlanRef = yield* Ref.make<Plan | undefined>(undefined);

      const maxIterations =
        config.maxIterations === 0
          ? Number.POSITIVE_INFINITY
          : config.maxIterations;

      const loopStarted: DomainEvent = {
        _tag: "LoopStarted",
        config,
        timestamp: startTime,
      };

      // Discovery phase - runs LLM to break down the task into subtasks
      // and writes tasks.md before iterations begin
      const discoveryStream = createDiscoveryStream(
        llm,
        signalParser,
        planStore,
        currentPlanRef,
        config,
        session.id
      );

      // Use unfoldEffect to create iterations with effectful termination condition
      const iterationsStream: Stream.Stream<DomainEvent, never, never> =
        Stream.unfoldEffect(1, (iteration: number) =>
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
        Stream.concat(discoveryStream),
        Stream.concat(iterationsStream),
        Stream.concat(completionStream)
      );
    }).pipe(
      // Also catch setup errors (e.g., session creation failure)
      Effect.catchAll((error: OrchestratorError) =>
        Effect.succeed(
          Stream.succeed({
            _tag: "LoopFailed",
            error: {
              message: error.message,
              phase: error.phase,
            },
          } as DomainEvent)
        )
      )
    )
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
      const endTimeUtc = yield* DateTime.now;
      const durationMs = DateTime.toEpochMillis(endTimeUtc) - startTime;
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
