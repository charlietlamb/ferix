import { DateTime, Effect, pipe, Ref, Stream } from "effect";
import { OrchestratorError } from "../domain/errors.js";
import type { DomainEvent, LoopConfig, Plan, Signal } from "../domain/index.js";
import type { LLMEvent } from "../domain/schemas/llm.js";
import type { PlanStoreService } from "../services/plan-store.js";
import type { SignalParserService } from "../services/signal-parser.js";
import {
  type MappingContext,
  mapLLMEventToDomain,
  mapSignalToDomain,
} from "./event-mapping.js";
import {
  flushPlanPersistence,
  type PlanPersistenceState,
  updatePlanFromSignal,
} from "./plan-updates.js";
import { areAllTasksComplete, buildPrompt } from "./prompt.js";

/**
 * Process signals from text and return events with completion flag and signals for plan updates.
 */
function processTextSignals(
  signalParser: SignalParserService,
  text: string,
  context: MappingContext
): Effect.Effect<
  { events: DomainEvent[]; completed: boolean; signals: Signal[] },
  never,
  never
> {
  return Effect.gen(function* () {
    const events: DomainEvent[] = [];
    let completed = false;
    const parsedSignals: Signal[] = [];

    const signals = yield* signalParser.parse(text).pipe(
      Effect.tapError((error) =>
        Effect.logDebug(
          "Signal parsing failed, continuing with empty signals",
          {
            error: String(error),
            textLength: text.length,
          }
        )
      ),
      Effect.orElseSucceed(() => [])
    );

    for (const signal of signals) {
      events.push(mapSignalToDomain(signal, context));
      parsedSignals.push(signal);
      if (signal._tag === "LoopComplete") {
        completed = true;
      }
    }

    return { events, completed, signals: parsedSignals };
  });
}

/**
 * Process a single LLM event and return domain events along with parsed signals.
 */
function processLLMEvent(
  signalParser: SignalParserService,
  llmEvent: LLMEvent,
  context: MappingContext
): Effect.Effect<
  { events: DomainEvent[]; completed: boolean; signals: Signal[] },
  never,
  never
> {
  return Effect.gen(function* () {
    const domainEvent = mapLLMEventToDomain(llmEvent, context);
    const events: DomainEvent[] = [domainEvent];
    let completed = false;
    const allSignals: Signal[] = [];

    if (llmEvent._tag === "Text" && llmEvent.text) {
      const result = yield* processTextSignals(
        signalParser,
        llmEvent.text,
        context
      );
      events.push(...result.events);
      allSignals.push(...result.signals);
      if (result.completed) {
        completed = true;
      }
    }

    if (llmEvent._tag === "Done") {
      const result = yield* processTextSignals(
        signalParser,
        llmEvent.output,
        context
      );
      allSignals.push(...result.signals);
      if (result.completed) {
        completed = true;
      }
    }

    return { events, completed, signals: allSignals };
  });
}

/**
 * Creates a stream for a single iteration.
 * Plan updates are batched and persisted once at the end of each iteration.
 *
 * @param llm - LLM service for executing prompts
 * @param signalParser - Signal parser service
 * @param planStore - Plan storage service
 * @param currentPlanRef - Reference to current plan
 * @param loopCompletedRef - Reference to loop completion state
 * @param config - Loop configuration
 * @param iteration - Current iteration number
 * @param sessionId - Session identifier
 * @param worktreePath - Optional worktree path for isolated execution
 */
export function createIterationStream(
  llm: {
    execute: (
      prompt: string,
      options?: { cwd?: string }
    ) => Stream.Stream<LLMEvent, unknown>;
  },
  signalParser: SignalParserService,
  planStore: PlanStoreService,
  currentPlanRef: Ref.Ref<Plan | undefined>,
  loopCompletedRef: Ref.Ref<boolean>,
  config: LoopConfig,
  iteration: number,
  sessionId: string,
  worktreePath?: string
): Stream.Stream<DomainEvent, never, never> {
  return Stream.unwrap(
    Effect.gen(function* () {
      // Read current plan from Ref before building prompt
      const currentPlan = yield* Ref.get(currentPlanRef);

      // Create persistence state ref for batched plan persistence
      const persistenceStateRef = yield* Ref.make<PlanPersistenceState>({
        dirty: false,
        pendingOperation: null,
      });

      const iterStarted: DomainEvent = {
        _tag: "IterationStarted",
        iteration,
      };

      const llmStream: Stream.Stream<DomainEvent, never, never> = llm
        .execute(
          buildPrompt(config, iteration, currentPlan),
          worktreePath ? { cwd: worktreePath } : undefined
        )
        .pipe(
          Stream.mapError(
            (e) =>
              new OrchestratorError({
                message: `LLM execution failed: ${String(e)}`,
                phase: "iteration",
                cause: e,
              })
          ),
          Stream.flatMap((llmEvent) =>
            Stream.unwrap(
              Effect.gen(function* () {
                const now = yield* DateTime.now;
                const context: MappingContext = {
                  timestamp: DateTime.toEpochMillis(now),
                };
                const result = yield* processLLMEvent(
                  signalParser,
                  llmEvent,
                  context
                );
                const events = [...result.events];

                // Process signals to update plan state (in-memory only)
                for (const signal of result.signals) {
                  const planEvents = yield* updatePlanFromSignal(
                    currentPlanRef,
                    persistenceStateRef,
                    signal,
                    sessionId,
                    config.task
                  );
                  events.push(...planEvents);
                }

                // Update completion state from LLM signal
                if (result.completed) {
                  yield* Effect.logInfo(
                    "[DEBUG] createIterationStream: LLM emitted completion signal"
                  );
                  yield* Ref.set(loopCompletedRef, true);
                }

                // Auto-complete if all tasks are done (prevents infinite linting loop)
                const updatedPlan = yield* Ref.get(currentPlanRef);
                const allComplete = areAllTasksComplete(updatedPlan);

                yield* Effect.logInfo(
                  "[DEBUG] createIterationStream: Auto-complete check",
                  {
                    llmEmittedComplete: result.completed,
                    allTasksComplete: allComplete,
                    taskStatuses: updatedPlan?.tasks.map((t) => ({
                      id: t.id,
                      status: t.status,
                    })),
                  }
                );

                if (allComplete) {
                  yield* Effect.logInfo(
                    "[DEBUG] createIterationStream: All tasks complete - ending loop"
                  );
                  yield* Ref.set(loopCompletedRef, true);
                }

                return Stream.fromIterable(events);
              })
            )
          ),
          // Convert LLM errors to LoopFailed events with iteration context
          Stream.catchAll((error: OrchestratorError) =>
            Stream.succeed({
              _tag: "LoopFailed",
              error: {
                message: error.message,
                phase: error.phase,
                iteration,
              },
            } as DomainEvent)
          )
        );

      // Completion stream that flushes batched persistence and emits IterationCompleted
      const completionStream: Stream.Stream<DomainEvent, never, never> =
        Stream.fromEffect(
          Effect.gen(function* () {
            // Flush batched plan persistence at end of iteration
            const persistEvents = yield* flushPlanPersistence(
              planStore,
              currentPlanRef,
              persistenceStateRef
            );

            const iterCompleted: DomainEvent = {
              _tag: "IterationCompleted",
              iteration,
            };

            return [...persistEvents, iterCompleted];
          })
        ).pipe(Stream.flatMap((events) => Stream.fromIterable(events)));

      return pipe(
        Stream.succeed(iterStarted),
        Stream.concat(llmStream),
        Stream.concat(completionStream)
      );
    })
  );
}
