import { DateTime, Effect, Option, pipe, Ref, Stream } from "effect";
import { OrchestratorError } from "../domain/errors.js";
import type {
  DomainEvent,
  LoopConfig,
  LoopSummary,
  Plan,
  Session,
} from "../domain/index.js";
import { Git, type WorktreePath } from "../services/git.js";
import { GuardrailsStore } from "../services/guardrails-store.js";
import { LLM } from "../services/llm.js";
import { PlanStore } from "../services/plan-store.js";
import { ProgressStore } from "../services/progress-store.js";
import { SessionStore } from "../services/session-store.js";
import { SignalParser } from "../services/signal-parser.js";
import { createDiscoveryStream } from "./discovery.js";
import {
  createIterationStream,
  createRalphIterationStream,
} from "./iteration.js";

/**
 * Required services for the orchestrator.
 * Now includes ProgressStore, GuardrailsStore, and Git for worktree support.
 */
export type OrchestratorServices =
  | LLM
  | SignalParser
  | PlanStore
  | SessionStore
  | ProgressStore
  | GuardrailsStore
  | Git;

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
      const git = yield* Git;

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

      // Create worktree for isolated execution
      const worktreePath = yield* git.createWorktree(session.id).pipe(
        Effect.mapError(
          (e) =>
            new OrchestratorError({
              message: `Failed to create worktree: ${e.message}`,
              phase: "setup",
              cause: e,
            })
        )
      );

      const branchName = git.getBranchName(session.id);

      // Update session with worktree info
      yield* sessionStore
        .update(session.id, {
          ...session,
          worktreePath,
          branchName,
        })
        .pipe(
          Effect.tapError((error) =>
            Effect.logDebug("Failed to update session with worktree info", {
              error: String(error),
            })
          ),
          Effect.orElseSucceed(() => undefined)
        );

      const startTimeUtc = yield* DateTime.now;
      const startTime = DateTime.toEpochMillis(startTimeUtc);

      // Emit worktree created event
      const worktreeCreated: DomainEvent = {
        _tag: "WorktreeCreated",
        sessionId: session.id,
        worktreePath,
        branchName,
        timestamp: startTime,
      };

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
        session.id,
        worktreePath
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
              session.id,
              worktreePath
            )
          )
        );

      const completionStream = createCompletionStream(
        sessionStore,
        git,
        session,
        config,
        startTime,
        loopCompletedRef,
        worktreePath
      );

      return pipe(
        Stream.succeed(loopStarted),
        Stream.concat(Stream.succeed(worktreeCreated)),
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
 * Run the ralph loop with full RALPH pattern support.
 *
 * Key differences from runLoop:
 * 1. Each iteration reads fresh context from files (progress, guardrails)
 * 2. LLM prompt focuses on ONLY the current task, not all tasks
 * 3. Learnings and guardrails are persisted to files after each iteration
 * 4. Supports cross-iteration learning through file-based state
 *
 * @param config - Loop configuration
 * @returns Stream of domain events
 */
export function runRalphLoop(
  config: LoopConfig
): Stream.Stream<DomainEvent, never, OrchestratorServices> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const llm = yield* LLM;
      const signalParser = yield* SignalParser;
      const sessionStore = yield* SessionStore;
      const planStore = yield* PlanStore;
      const progressStore = yield* ProgressStore;
      const guardrailsStore = yield* GuardrailsStore;
      const git = yield* Git;

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

      // Create worktree for isolated execution
      const worktreePath = yield* git.createWorktree(session.id).pipe(
        Effect.mapError(
          (e) =>
            new OrchestratorError({
              message: `Failed to create worktree: ${e.message}`,
              phase: "setup",
              cause: e,
            })
        )
      );

      const branchName = git.getBranchName(session.id);

      // Update session with worktree info
      yield* sessionStore
        .update(session.id, {
          ...session,
          worktreePath,
          branchName,
        })
        .pipe(
          Effect.tapError((error) =>
            Effect.logDebug("Failed to update session with worktree info", {
              error: String(error),
            })
          ),
          Effect.orElseSucceed(() => undefined)
        );

      const startTimeUtc = yield* DateTime.now;
      const startTime = DateTime.toEpochMillis(startTimeUtc);

      // Emit worktree created event
      const worktreeCreated: DomainEvent = {
        _tag: "WorktreeCreated",
        sessionId: session.id,
        worktreePath,
        branchName,
        timestamp: startTime,
      };

      // Use Effect Ref for mutable state - still needed for in-iteration updates
      // but state is read fresh from files at the START of each iteration
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
      const discoveryStream = createDiscoveryStream(
        llm,
        signalParser,
        planStore,
        currentPlanRef,
        config,
        session.id,
        worktreePath
      );

      // RALPH iterations - each reads fresh context from files
      const iterationsStream: Stream.Stream<DomainEvent, never, never> =
        Stream.unfoldEffect(1, (iteration: number) =>
          Effect.gen(function* () {
            const completed = yield* Ref.get(loopCompletedRef);
            if (completed || iteration > maxIterations) {
              return Option.none<readonly [number, number]>();
            }
            return Option.some([iteration, iteration + 1] as const);
          })
        ).pipe(
          Stream.flatMap((iteration: number) =>
            createRalphIterationStream(
              llm,
              signalParser,
              planStore,
              progressStore,
              guardrailsStore,
              currentPlanRef,
              loopCompletedRef,
              config,
              iteration,
              session.id,
              worktreePath
            )
          )
        );

      const completionStream = createCompletionStream(
        sessionStore,
        git,
        session,
        config,
        startTime,
        loopCompletedRef,
        worktreePath
      );

      return pipe(
        Stream.succeed(loopStarted),
        Stream.concat(Stream.succeed(worktreeCreated)),
        Stream.concat(discoveryStream),
        Stream.concat(iterationsStream),
        Stream.concat(completionStream)
      );
    }).pipe(
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
 * Handles session update, worktree cleanup, and emits completion events.
 * Worktree is removed but branch is preserved for user review/merge.
 */
function createCompletionStream(
  sessionStore: {
    update: (id: string, session: Session) => Effect.Effect<void, unknown>;
  },
  git: {
    commitChanges: (
      sessionId: string,
      message: string
    ) => Effect.Effect<unknown, unknown>;
    removeWorktreeKeepBranch: (
      sessionId: string
    ) => Effect.Effect<void, unknown>;
  },
  session: Session,
  config: LoopConfig,
  startTime: number,
  loopCompletedRef: Ref.Ref<boolean>,
  _worktreePath: WorktreePath
): Stream.Stream<DomainEvent, never, never> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const endTimeUtc = yield* DateTime.now;
      const endTime = DateTime.toEpochMillis(endTimeUtc);
      const durationMs = endTime - startTime;
      const completed = yield* Ref.get(loopCompletedRef);

      // Final commit before completion
      yield* git
        .commitChanges(session.id, `feat: complete session ${session.id}`)
        .pipe(
          Effect.tapError((error) =>
            Effect.logDebug("Final commit failed, continuing", {
              sessionId: session.id,
              error: String(error),
            })
          ),
          Effect.orElseSucceed(() => undefined)
        );

      // Remove worktree but keep branch for user review
      yield* git.removeWorktreeKeepBranch(session.id).pipe(
        Effect.tapError((error) =>
          Effect.logDebug("Worktree cleanup failed, continuing", {
            sessionId: session.id,
            error: String(error),
          })
        ),
        Effect.orElseSucceed(() => undefined)
      );

      const worktreeRemoved: DomainEvent = {
        _tag: "WorktreeRemoved",
        sessionId: session.id,
        timestamp: endTime,
      };

      const summary: LoopSummary = {
        iterations: config.maxIterations,
        success: completed,
        sessionId: session.id,
        completedTasks: session.completedTasks,
        durationMs,
      };

      // Session update is best-effort - log failures but don't fail the loop
      // since the loop has already completed successfully
      // Clear worktree path since it's removed
      yield* sessionStore
        .update(session.id, {
          ...session,
          status: completed ? "completed" : "paused",
          worktreePath: undefined,
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

      const loopCompleted: DomainEvent = { _tag: "LoopCompleted", summary };

      return pipe(
        Stream.succeed(worktreeRemoved),
        Stream.concat(Stream.succeed(loopCompleted))
      );
    })
  );
}
