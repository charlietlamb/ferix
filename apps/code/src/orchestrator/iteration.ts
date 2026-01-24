import { DateTime, Effect, pipe, Ref, Stream } from "effect";
import { OrchestratorError } from "../domain/errors.js";
import type {
  DomainEvent,
  Guardrail,
  LoopConfig,
  Plan,
  ProgressEntry,
  Signal,
} from "../domain/index.js";
import type { LLMEvent } from "../domain/schemas/llm.js";
import type { GuardrailsStoreService } from "../services/guardrails-store.js";
import type { PlanStoreService } from "../services/plan-store.js";
import type { ProgressStoreService } from "../services/progress-store.js";
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
import {
  buildProgressSummary,
  buildPrompt,
  buildRalphPrompt,
  type RalphIterationContext,
  selectCurrentTask,
} from "./prompt.js";

/**
 * Collected learnings and guardrails from an iteration.
 */
interface IterationLearnings {
  readonly learnings: string[];
  readonly guardrails: Guardrail[];
}

/**
 * Maps task status to progress action.
 */
function getProgressAction(
  taskStatus: string
): "completed" | "failed" | "started" {
  if (taskStatus === "done") {
    return "completed";
  }
  if (taskStatus === "failed") {
    return "failed";
  }
  return "started";
}

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
 * Extracts learnings and guardrails from signals.
 */
function extractLearnings(
  signals: Signal[],
  context: MappingContext,
  iteration: number
): IterationLearnings {
  const learnings: string[] = [];
  const guardrails: Guardrail[] = [];

  for (const signal of signals) {
    if (signal._tag === "Learning") {
      learnings.push(signal.content);
    } else if (signal._tag === "Guardrail") {
      guardrails.push({
        id: `gr-${iteration}-${guardrails.length + 1}`,
        createdAt: new Date(context.timestamp).toISOString(),
        iteration,
        pattern: signal.pattern,
        sign: signal.sign,
        avoidance: signal.avoidance,
        severity: signal.severity,
      });
    }
  }

  return { learnings, guardrails };
}

/**
 * Creates a stream for a single iteration.
 * Plan updates are batched and persisted once at the end of each iteration.
 */
export function createIterationStream(
  llm: { execute: (prompt: string) => Stream.Stream<LLMEvent, unknown> },
  signalParser: SignalParserService,
  planStore: PlanStoreService,
  currentPlanRef: Ref.Ref<Plan | undefined>,
  loopCompletedRef: Ref.Ref<boolean>,
  config: LoopConfig,
  iteration: number,
  sessionId: string
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
        .execute(buildPrompt(config, iteration, currentPlan))
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

                // Update completion state
                if (result.completed) {
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

/**
 * Creates a RALPH iteration stream that reads fresh context from files.
 *
 * Key differences from createIterationStream:
 * 1. Reads plan fresh from planStore instead of using Ref
 * 2. Reads guardrails from guardrailsStore
 * 3. Reads recent progress from progressStore
 * 4. Uses buildRalphPrompt for single-task focus
 * 5. Persists learnings and guardrails at end of iteration
 */
export function createRalphIterationStream(
  llm: { execute: (prompt: string) => Stream.Stream<LLMEvent, unknown> },
  signalParser: SignalParserService,
  planStore: PlanStoreService,
  progressStore: ProgressStoreService,
  guardrailsStore: GuardrailsStoreService,
  currentPlanRef: Ref.Ref<Plan | undefined>,
  loopCompletedRef: Ref.Ref<boolean>,
  config: LoopConfig,
  iteration: number,
  sessionId: string
): Stream.Stream<DomainEvent, never, never> {
  return Stream.unwrap(
    Effect.gen(function* () {
      // READ FRESH STATE FROM FILES (RALPH pattern)
      // Plan is read from Ref (which was loaded from file at session start)
      const currentPlan = yield* Ref.get(currentPlanRef);

      // Load guardrails from file
      const guardrails = yield* guardrailsStore
        .getActive(sessionId)
        .pipe(Effect.orElseSucceed(() => [] as readonly Guardrail[]));

      // Load recent progress from file
      const recentProgress = yield* progressStore
        .getRecent(sessionId, 10)
        .pipe(Effect.orElseSucceed(() => [] as readonly ProgressEntry[]));

      // Select current task (in_progress > pending)
      const currentTask = selectCurrentTask(currentPlan);

      // Build context from files
      const context: RalphIterationContext = {
        currentTask,
        progressSummary: buildProgressSummary(recentProgress),
        guardrails,
        recentLearnings: recentProgress.filter(
          (e) => e.learnings && e.learnings.length > 0
        ),
      };

      // Create persistence state ref for batched plan persistence
      const persistenceStateRef = yield* Ref.make<PlanPersistenceState>({
        dirty: false,
        pendingOperation: null,
      });

      // Track learnings collected during this iteration
      const iterationLearningsRef = yield* Ref.make<IterationLearnings>({
        learnings: [],
        guardrails: [],
      });

      const iterStarted: DomainEvent = {
        _tag: "IterationStarted",
        iteration,
      };

      // Build RALPH prompt with single-task focus
      const prompt = buildRalphPrompt(config, iteration, context);

      const llmStream: Stream.Stream<DomainEvent, never, never> = llm
        .execute(prompt)
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
                const mappingContext: MappingContext = {
                  timestamp: DateTime.toEpochMillis(now),
                };
                const result = yield* processLLMEvent(
                  signalParser,
                  llmEvent,
                  mappingContext
                );
                const events = [...result.events];

                // Extract learnings and guardrails from signals
                const newLearnings = extractLearnings(
                  result.signals,
                  mappingContext,
                  iteration
                );
                if (
                  newLearnings.learnings.length > 0 ||
                  newLearnings.guardrails.length > 0
                ) {
                  yield* Ref.update(iterationLearningsRef, (current) => ({
                    learnings: [
                      ...current.learnings,
                      ...newLearnings.learnings,
                    ],
                    guardrails: [
                      ...current.guardrails,
                      ...newLearnings.guardrails,
                    ],
                  }));
                }

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

                // Update completion state
                if (result.completed) {
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

      // Completion stream that persists learnings and plan
      const completionStream: Stream.Stream<DomainEvent, never, never> =
        Stream.fromEffect(
          Effect.gen(function* () {
            const events: DomainEvent[] = [];
            const now = yield* DateTime.now;
            const timestamp = DateTime.toEpochMillis(now);

            // Get collected learnings
            const learnings = yield* Ref.get(iterationLearningsRef);

            // Persist guardrails to file
            for (const guardrail of learnings.guardrails) {
              yield* guardrailsStore.add(sessionId, guardrail).pipe(
                Effect.tapError((error) =>
                  Effect.logDebug("Failed to persist guardrail", {
                    error: String(error),
                  })
                ),
                Effect.orElseSucceed(() => undefined)
              );

              events.push({
                _tag: "GuardrailAdded",
                id: guardrail.id,
                iteration,
                pattern: guardrail.pattern,
                sign: guardrail.sign,
                avoidance: guardrail.avoidance,
                severity: guardrail.severity,
                timestamp,
              });
            }

            // Persist progress entry to file
            const plan = yield* Ref.get(currentPlanRef);
            const task = selectCurrentTask(plan);
            if (task) {
              const progressEntry: ProgressEntry = {
                iteration,
                timestamp: new Date(timestamp).toISOString(),
                taskId: task.id,
                action: getProgressAction(task.status),
                summary: task.completionNotes || `Working on ${task.title}`,
                learnings:
                  learnings.learnings.length > 0
                    ? learnings.learnings
                    : undefined,
                filesModified: task.filesToModify,
              };

              yield* progressStore.append(sessionId, progressEntry).pipe(
                Effect.tapError((error) =>
                  Effect.logDebug("Failed to persist progress", {
                    error: String(error),
                  })
                ),
                Effect.orElseSucceed(() => undefined)
              );

              events.push({
                _tag: "ProgressUpdated",
                sessionId,
                iteration,
                taskId: task.id,
                action: progressEntry.action,
                timestamp,
              });
            }

            // Emit learning events
            for (const learning of learnings.learnings) {
              events.push({
                _tag: "LearningRecorded",
                iteration,
                content: learning,
                timestamp,
              });
            }

            // Flush batched plan persistence at end of iteration
            const persistEvents = yield* flushPlanPersistence(
              planStore,
              currentPlanRef,
              persistenceStateRef
            );
            events.push(...persistEvents);

            const iterCompleted: DomainEvent = {
              _tag: "IterationCompleted",
              iteration,
            };
            events.push(iterCompleted);

            return events;
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
