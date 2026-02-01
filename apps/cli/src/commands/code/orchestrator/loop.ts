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
import type { GuardrailsStore } from "../services/guardrails-store.js";
import { LLM } from "../services/llm.js";
import { PlanStore } from "../services/plan-store.js";
import { ProgressStore } from "../services/progress-store.js";
import { PromptStore } from "../services/prompt-store.js";
import { SessionStore } from "../services/session-store.js";
import { SignalParser } from "../services/signal-parser.js";
import { StateStore } from "../services/state-store.js";
import { createDiscoveryStream } from "./discovery.js";
import { createIterationStream } from "./iteration.js";

/**
 * Required services for the orchestrator.
 * Includes ProgressStore, GuardrailsStore, Git, StateStore, and PromptStore.
 */
export type OrchestratorServices =
  | LLM
  | SignalParser
  | PlanStore
  | SessionStore
  | ProgressStore
  | GuardrailsStore
  | Git
  | StateStore
  | PromptStore;

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
      const progressStore = yield* ProgressStore;
      const git = yield* Git;
      const stateStore = yield* StateStore;
      const promptStore = yield* PromptStore;

      const session = yield* sessionStore
        .create(config.task, config.sessionId)
        .pipe(
          Effect.mapError(
            (e) =>
              new OrchestratorError({
                message: `Failed to create session: ${e.message}`,
                phase: "setup",
                cause: e,
              })
          )
        );

      // Capture the current branch as the base branch for PR creation
      const baseBranch = yield* git.getCurrentBranch().pipe(
        Effect.tapError((error) =>
          Effect.logDebug("Failed to get current branch", {
            error: String(error),
          })
        ),
        Effect.orElseSucceed(() => undefined)
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

      // Update session with worktree info and base branch
      yield* sessionStore
        .update(session.id, {
          ...session,
          worktreePath,
          branchName,
          baseBranch,
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
      // Track session state for updates during discovery (includes baseBranch)
      const initialSession: Session = { ...session, baseBranch };
      const sessionRef = yield* Ref.make(initialSession);

      const maxIterations =
        config.maxIterations === 0
          ? Number.POSITIVE_INFINITY
          : config.maxIterations;

      const loopStarted: DomainEvent = {
        _tag: "LoopStarted",
        config,
        timestamp: startTime,
      };

      // Callback to handle session name generated during discovery
      const handleSessionName = (displayName: string) =>
        Effect.gen(function* () {
          const currentSession = yield* Ref.get(sessionRef);

          // Rename the branch to use the descriptive name
          const newBranchName = yield* git.renameBranch(
            session.id,
            displayName
          );

          // Update session with display name and new branch name
          const updatedSession = {
            ...currentSession,
            displayName,
            branchName: newBranchName,
          };

          yield* sessionStore.update(session.id, updatedSession);
          yield* Ref.set(sessionRef, updatedSession);
        });

      // Discovery phase - runs LLM to break down the task into subtasks,
      // generates a descriptive session name, copies PROMPT.md, and writes tasks.json + STATE.json
      const discoveryStream = createDiscoveryStream(
        llm,
        signalParser,
        planStore,
        stateStore,
        promptStore,
        progressStore,
        currentPlanRef,
        config,
        session.id,
        worktreePath,
        handleSessionName
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
              stateStore,
              progressStore,
              { commitChanges: git.commitChanges },
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
        {
          commitChanges: git.commitChanges,
          removeWorktreeKeepBranch: git.removeWorktreeKeepBranch,
          pushBranch: git.pushBranch,
          createPR: git.createPR,
          getBranchName: git.getBranchName,
        },
        sessionRef,
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
 * Generates PR body from session context.
 */
function buildPRBody(session: Session, config: LoopConfig): string {
  const completedTasks =
    session.completedTasks.length > 0
      ? session.completedTasks.map((t) => `- ${t}`).join("\n")
      : "- No specific tasks tracked";

  return `## Summary
${config.task}

## Completed Tasks
${completedTasks}

---
Generated by Ferix`;
}

type PushResult = { success: true } | { success: false; error: string };

type PRResult =
  | { success: true; url: string }
  | { success: false; error: string };

interface CompletionGitService {
  commitChanges: (
    sessionId: string,
    message: string
  ) => Effect.Effect<unknown, unknown>;
  removeWorktreeKeepBranch: (sessionId: string) => Effect.Effect<void, unknown>;
  pushBranch: (sessionId: string) => Effect.Effect<void, unknown>;
  createPR: (
    sessionId: string,
    title: string,
    body: string,
    baseBranch?: string
  ) => Effect.Effect<string, unknown>;
  getBranchName: (sessionId: string) => string;
}

/**
 * Attempts to push branch to remote with proper error handling.
 */
function attemptPush(
  git: Pick<CompletionGitService, "pushBranch">,
  sessionId: string
): Effect.Effect<PushResult, never, never> {
  return git.pushBranch(sessionId).pipe(
    Effect.map(() => ({ success: true as const })),
    Effect.catchAll((error) =>
      Effect.succeed({ success: false as const, error: String(error) })
    )
  );
}

/**
 * Attempts to create PR with proper error handling.
 */
function attemptCreatePR(
  git: Pick<CompletionGitService, "createPR">,
  sessionId: string,
  title: string,
  body: string,
  baseBranch?: string
): Effect.Effect<PRResult, never, never> {
  return git.createPR(sessionId, title, body, baseBranch).pipe(
    Effect.map((url) => ({ success: true as const, url })),
    Effect.catchAll((error) =>
      Effect.succeed({ success: false as const, error: String(error) })
    )
  );
}

/**
 * Performs final commit with error logging but no failure.
 */
function performFinalCommit(
  git: Pick<CompletionGitService, "commitChanges">,
  sessionId: string,
  message: string
): Effect.Effect<void, never, never> {
  return git.commitChanges(sessionId, message).pipe(
    Effect.tapError((error) =>
      Effect.logDebug("Final commit failed, continuing", {
        sessionId,
        error: String(error),
      })
    ),
    Effect.orElseSucceed(() => undefined),
    Effect.asVoid
  );
}

/**
 * Removes worktree with error logging but no failure.
 */
function cleanupWorktree(
  git: Pick<CompletionGitService, "removeWorktreeKeepBranch">,
  sessionId: string
): Effect.Effect<void, never, never> {
  return git.removeWorktreeKeepBranch(sessionId).pipe(
    Effect.tapError((error) =>
      Effect.logDebug("Worktree cleanup failed, continuing", {
        sessionId,
        error: String(error),
      })
    ),
    Effect.orElseSucceed(() => undefined)
  );
}

/**
 * Performs push and PR creation operations with proper error handling.
 */
function performPushAndPR(
  git: Pick<CompletionGitService, "pushBranch" | "createPR">,
  session: Session,
  config: LoopConfig
): Effect.Effect<
  { pushResult: PushResult | null; prResult: PRResult | null },
  never,
  never
> {
  return Effect.gen(function* () {
    let pushResult: PushResult | null = null;
    let prResult: PRResult | null = null;

    // Push branch if requested
    if (config.push === true || config.pr === true) {
      pushResult = yield* attemptPush(git, session.id);
      if (!pushResult.success) {
        yield* Effect.logWarning("Push failed", {
          sessionId: session.id,
          error: pushResult.error,
        });
      }
    }

    // Create PR if requested and push succeeded
    if (config.pr === true && pushResult?.success) {
      const title = `feat: ${session.originalTask.slice(0, 50)}`;
      const body = buildPRBody(session, config);
      prResult = yield* attemptCreatePR(
        git,
        session.id,
        title,
        body,
        session.baseBranch
      );
      if (!prResult.success) {
        yield* Effect.logWarning("PR creation failed", {
          sessionId: session.id,
          error: prResult.error,
        });
      }
    }

    return { pushResult, prResult };
  });
}

/**
 * Updates session status with error logging but no failure.
 */
function updateSessionStatus(
  sessionStore: {
    update: (id: string, session: Session) => Effect.Effect<void, unknown>;
  },
  session: Session,
  completed: boolean
): Effect.Effect<void, never, never> {
  return sessionStore
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
}

/**
 * Builds completion events based on push/PR results.
 */
function buildCompletionEvents(
  sessionId: string,
  branchName: string,
  endTime: number,
  pushResult: PushResult | null,
  prResult: PRResult | null,
  prRequested: boolean,
  taskTitle: string
): DomainEvent[] {
  const events: DomainEvent[] = [];

  if (pushResult?.success) {
    events.push({
      _tag: "BranchPushed",
      sessionId,
      branchName,
      timestamp: endTime,
    });
  } else if (pushResult && !pushResult.success) {
    events.push({
      _tag: "PushFailed",
      sessionId,
      error: pushResult.error,
      timestamp: endTime,
    });
  }

  if (prResult?.success) {
    events.push({
      _tag: "PRCreated",
      sessionId,
      prUrl: prResult.url,
      title: taskTitle,
      timestamp: endTime,
    });
  } else if (prResult && !prResult.success) {
    events.push({
      _tag: "PRCreationFailed",
      sessionId,
      error: prResult.error,
      timestamp: endTime,
    });
  } else if (prRequested && pushResult && !pushResult.success) {
    // PR was requested but push failed
    events.push({
      _tag: "PRCreationFailed",
      sessionId,
      error: `Cannot create PR: push failed (${pushResult.error})`,
      timestamp: endTime,
    });
  }

  return events;
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
    pushBranch: (sessionId: string) => Effect.Effect<void, unknown>;
    createPR: (
      sessionId: string,
      title: string,
      body: string,
      baseBranch?: string
    ) => Effect.Effect<string, unknown>;
    getBranchName: (sessionId: string) => string;
  },
  sessionRef: Ref.Ref<Session>,
  config: LoopConfig,
  startTime: number,
  loopCompletedRef: Ref.Ref<boolean>,
  _worktreePath: WorktreePath
): Stream.Stream<DomainEvent, never, never> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const session = yield* Ref.get(sessionRef);
      const endTimeUtc = yield* DateTime.now;
      const endTime = DateTime.toEpochMillis(endTimeUtc);
      const durationMs = endTime - startTime;
      const completed = yield* Ref.get(loopCompletedRef);

      // Final commit before completion
      const finalCommitMessage = session.displayName
        ? `feat: complete ${session.displayName}`
        : `feat: complete ${session.originalTask.slice(0, 50)}`;
      yield* performFinalCommit(git, session.id, finalCommitMessage);

      // Push and PR operations
      const { pushResult, prResult } = yield* performPushAndPR(
        git,
        session,
        config
      );

      // Remove worktree but keep branch for user review
      yield* cleanupWorktree(git, session.id);

      const worktreeRemoved: DomainEvent = {
        _tag: "WorktreeRemoved",
        sessionId: session.id,
        timestamp: endTime,
      };

      const branchPushed = pushResult?.success ?? false;
      const prUrl = prResult?.success ? prResult.url : undefined;

      const summary: LoopSummary = {
        iterations: config.maxIterations,
        success: completed,
        sessionId: session.id,
        completedTasks: session.completedTasks,
        durationMs,
        branchPushed: branchPushed || undefined,
        prUrl: prUrl || undefined,
      };

      // Session update is best-effort
      yield* updateSessionStatus(sessionStore, session, completed);

      // Build events
      const branchName = session.branchName ?? git.getBranchName(session.id);
      const taskTitle = `feat: ${session.originalTask.slice(0, 50)}`;
      const completionEvents = buildCompletionEvents(
        session.id,
        branchName,
        endTime,
        pushResult,
        prResult,
        config.pr === true,
        taskTitle
      );

      const events: DomainEvent[] = [
        worktreeRemoved,
        ...completionEvents,
        { _tag: "LoopCompleted", summary },
      ];

      return Stream.fromIterable(events);
    })
  );
}
