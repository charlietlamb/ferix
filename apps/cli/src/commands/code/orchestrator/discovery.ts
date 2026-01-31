import { DateTime, Effect, pipe, Ref, Stream } from "effect";
import { OrchestratorError } from "../domain/errors.js";
import type {
  DomainEvent,
  LoopConfig,
  Plan,
  ProgressEntry,
  Signal,
} from "../domain/index.js";
import type { LLMEvent } from "../domain/schemas/llm.js";
import type { SessionState } from "../domain/schemas/state.js";
import type {
  GeneratedTask,
  TasksFile,
} from "../domain/schemas/task-generation.js";
import { writeTasksJson } from "../layers/plan/task-generation.js";
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
import { buildDiscoveryPrompt, buildSessionState } from "./prompt.js";

/**
 * Process signals from text and return events with parsed signals.
 */
function processTextSignals(
  signalParser: SignalParserService,
  text: string,
  context: MappingContext
): Effect.Effect<{ events: DomainEvent[]; signals: Signal[] }, never, never> {
  return Effect.gen(function* () {
    const events: DomainEvent[] = [];
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
    }

    return { events, signals: parsedSignals };
  });
}

/**
 * Process a single LLM event and return domain events along with parsed signals.
 */
function processLLMEvent(
  signalParser: SignalParserService,
  llmEvent: LLMEvent,
  context: MappingContext
): Effect.Effect<{ events: DomainEvent[]; signals: Signal[] }, never, never> {
  return Effect.gen(function* () {
    const domainEvent = mapLLMEventToDomain(llmEvent, context);
    const events: DomainEvent[] = [domainEvent];
    const allSignals: Signal[] = [];

    if (llmEvent._tag === "Text" && llmEvent.text) {
      const result = yield* processTextSignals(
        signalParser,
        llmEvent.text,
        context
      );
      events.push(...result.events);
      allSignals.push(...result.signals);
    }

    if (llmEvent._tag === "Done") {
      const result = yield* processTextSignals(
        signalParser,
        llmEvent.output,
        context
      );
      allSignals.push(...result.signals);
    }

    return { events, signals: allSignals };
  });
}

/**
 * Map plan task status to generated task status
 */
function mapTaskStatus(
  status: Plan["tasks"][number]["status"]
): GeneratedTask["status"] {
  if (status === "done") {
    return "done";
  }
  if (status === "in_progress" || status === "planning") {
    return "in_progress";
  }
  if (status === "failed") {
    return "failed";
  }
  return "pending";
}

/**
 * Convert plan tasks to TasksFile format for tasks.json
 */
function planToTasksFile(
  plan: Plan,
  sessionId: string,
  originalTask: string
): TasksFile {
  return {
    sessionId,
    originalTask,
    tasks: plan.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: mapTaskStatus(task.status),
      steps: task.phases.map((p) => p.description),
    })),
  };
}

/**
 * Callback invoked when a session name is generated during discovery.
 * This allows the orchestrator to update the session and rename the branch.
 */
export type SessionNameCallback = (
  displayName: string
) => Effect.Effect<void, unknown>;

/**
 * Creates a stream for the discovery phase.
 * This phase runs the LLM to break down the task into subtasks,
 * generates a descriptive session name, copies PROMPT.md template,
 * writes tasks.json and STATE.json, and initializes the plan.
 *
 * @param llm - LLM service for executing prompts
 * @param signalParser - Signal parser service
 * @param planStore - Plan storage service
 * @param stateStore - State storage service
 * @param promptStore - Prompt template storage service
 * @param progressStore - Progress storage service for recent progress summaries
 * @param currentPlanRef - Reference to current plan
 * @param config - Loop configuration
 * @param sessionId - Session identifier
 * @param worktreePath - Optional worktree path for isolated execution
 * @param onSessionName - Optional callback invoked when session name is generated
 */
export function createDiscoveryStream(
  llm: {
    execute: (
      prompt: string,
      options?: { cwd?: string; yolo?: boolean }
    ) => Stream.Stream<LLMEvent, unknown>;
  },
  signalParser: SignalParserService,
  planStore: PlanStoreService,
  stateStore: {
    write: (
      sessionId: string,
      state: SessionState
    ) => Effect.Effect<void, unknown>;
  },
  promptStore: {
    copyTemplate: (sessionId: string) => Effect.Effect<void, unknown>;
  },
  progressStore: {
    getRecent: (
      sessionId: string,
      count: number
    ) => Effect.Effect<readonly ProgressEntry[], unknown>;
  },
  currentPlanRef: Ref.Ref<Plan | undefined>,
  config: LoopConfig,
  sessionId: string,
  worktreePath?: string,
  onSessionName?: SessionNameCallback
): Stream.Stream<DomainEvent, never, never> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const startTimeUtc = yield* DateTime.now;
      const startTime = DateTime.toEpochMillis(startTimeUtc);

      // Create persistence state ref for batched plan persistence
      const persistenceStateRef = yield* Ref.make<PlanPersistenceState>({
        dirty: false,
        pendingOperation: null,
      });

      // Track captured session name from signals
      const sessionNameRef = yield* Ref.make<string | undefined>(undefined);

      const discoveryStarted: DomainEvent = {
        _tag: "DiscoveryStarted",
        timestamp: startTime,
      };

      // Tool call to show in TUI during discovery (displays as >> Analysing tasks)
      const analysingToolUse: DomainEvent = {
        _tag: "LLMToolUse",
        tool: "Analysing tasks",
        input: {},
      };

      // Build discovery-specific prompt
      const prompt = buildDiscoveryPrompt(config);

      const llmStream: Stream.Stream<DomainEvent, never, never> = llm
        .execute(prompt, { cwd: worktreePath, yolo: config.yolo })
        .pipe(
          Stream.mapError(
            (e) =>
              new OrchestratorError({
                message: `LLM execution failed during discovery: ${String(e)}`,
                phase: "discovery",
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
                  // Capture session name signal
                  if (signal._tag === "SessionNameDefined") {
                    yield* Ref.set(sessionNameRef, signal.name);
                  }

                  const planEvents = yield* updatePlanFromSignal(
                    currentPlanRef,
                    persistenceStateRef,
                    signal,
                    sessionId,
                    config.task
                  );
                  events.push(...planEvents);
                }

                return Stream.fromIterable(events);
              })
            )
          ),
          // Convert LLM errors to LoopFailed events
          Stream.catchAll((error: OrchestratorError) =>
            Stream.succeed({
              _tag: "LoopFailed",
              error: {
                message: error.message,
                phase: error.phase,
              },
            } as DomainEvent)
          )
        );

      // Completion stream that flushes persistence, writes files, and emits DiscoveryCompleted
      const completionStream: Stream.Stream<DomainEvent, never, never> =
        Stream.fromEffect(
          Effect.gen(function* () {
            // Flush batched plan persistence
            const persistEvents = yield* flushPlanPersistence(
              planStore,
              currentPlanRef,
              persistenceStateRef
            );

            // Get the plan
            const plan = yield* Ref.get(currentPlanRef);
            const taskCount = plan?.tasks.length ?? 0;

            // Copy PROMPT.md template to session directory for debugging visibility
            yield* promptStore.copyTemplate(sessionId).pipe(
              Effect.tapError((error) =>
                Effect.logDebug("Failed to copy PROMPT.md, continuing", {
                  error: String(error),
                })
              ),
              Effect.orElseSucceed(() => undefined)
            );

            // Write tasks.json if we have tasks
            if (plan && plan.tasks.length > 0) {
              const tasksFile = planToTasksFile(plan, sessionId, config.task);
              yield* writeTasksJson(sessionId, tasksFile).pipe(
                Effect.tapError((error) =>
                  Effect.logDebug("Failed to write tasks.json, continuing", {
                    error: String(error),
                  })
                ),
                Effect.orElseSucceed(() => undefined)
              );

              // Write initial STATE.json
              // Fetch recent progress entries to include in state
              const recentEntries = yield* progressStore
                .getRecent(sessionId, 5)
                .pipe(
                  Effect.tapError((error) =>
                    Effect.logDebug(
                      "Failed to get recent progress, continuing",
                      {
                        error: String(error),
                      }
                    )
                  ),
                  Effect.orElseSucceed(() => [] as const)
                );
              const recentProgress = recentEntries.map(
                (entry) =>
                  `[${entry.action}] Task ${entry.taskId}: ${entry.summary}`
              );

              const initialState = buildSessionState(
                config,
                0, // iteration 0 = discovery
                sessionId,
                plan,
                recentProgress
              );
              yield* stateStore.write(sessionId, initialState).pipe(
                Effect.tapError((error) =>
                  Effect.logDebug("Failed to write STATE.json, continuing", {
                    error: String(error),
                  })
                ),
                Effect.orElseSucceed(() => undefined)
              );
            }

            const endTimeUtc = yield* DateTime.now;
            const endTime = DateTime.toEpochMillis(endTimeUtc);

            const events: DomainEvent[] = [...persistEvents];

            // Handle session name if captured
            const capturedName = yield* Ref.get(sessionNameRef);
            if (capturedName) {
              // Call the callback to update session and rename branch
              if (onSessionName) {
                yield* onSessionName(capturedName).pipe(
                  Effect.tapError((error) =>
                    Effect.logDebug(
                      "Failed to handle session name, continuing",
                      {
                        error: String(error),
                        displayName: capturedName,
                      }
                    )
                  ),
                  Effect.orElseSucceed(() => undefined)
                );
              }

              // Emit SessionNameGenerated event
              const sessionNameEvent: DomainEvent = {
                _tag: "SessionNameGenerated",
                sessionId,
                displayName: capturedName,
                timestamp: endTime,
              };
              events.push(sessionNameEvent);
            }

            const discoveryCompleted: DomainEvent = {
              _tag: "DiscoveryCompleted",
              taskCount,
              timestamp: endTime,
            };
            events.push(discoveryCompleted);

            return events;
          })
        ).pipe(Stream.flatMap((events) => Stream.fromIterable(events)));

      return pipe(
        Stream.succeed(discoveryStarted),
        Stream.concat(Stream.succeed(analysingToolUse)),
        Stream.concat(llmStream),
        Stream.concat(completionStream)
      );
    })
  );
}
