# PRD: Worktree Refactor - Delete Worktree, Keep Branch

## Overview

Currently, ferix keeps both the git worktree directory AND the branch after a session completes. This PRD proposes deleting the worktree directory while preserving the branch, reducing disk usage while maintaining all functionality.

## Problem Statement

When ferix completes a session:
- A worktree directory remains at `.ferix/worktrees/{sessionId}/` (full copy of codebase)
- A branch exists at `ferix/{sessionId}` with all commits
- The worktree is **redundant** - users can access all changes via the branch
- Disk usage grows unbounded as sessions accumulate
- Manual cleanup required

## Proposed Solution

After session completion:
1. Commit all changes (already happens)
2. Remove the worktree directory
3. Keep the branch for user review/merge
4. Emit `WorktreeRemoved` event

## Benefits

| Metric | Current | Proposed |
|--------|---------|----------|
| Disk per session | Full codebase copy | ~0 (git refs only) |
| Cleanup required | Manual | Automatic |
| User can review changes | Yes (worktree or branch) | Yes (branch only) |
| User can merge changes | Yes | Yes |

## User Workflow After Change

Users can still:
```bash
# View changes
git log ferix/{sessionId}
git diff main..ferix/{sessionId}

# Merge when ready
git merge ferix/{sessionId}

# Or checkout to get a working copy
git checkout ferix/{sessionId}
```

---

## Implementation Plan

### 1. Add New Method to Git Service Interface

**File:** `apps/code/src/services/git.ts`

Add a new method to `GitService` interface:

```typescript
/**
 * Remove a worktree but keep its branch.
 *
 * Removes the worktree directory and cleans up git worktree references,
 * but preserves the branch for user review and merge.
 *
 * @param sessionId - Session ID whose worktree to remove
 */
readonly removeWorktreeKeepBranch: (sessionId: string) => Effect.Effect<void, GitError>;
```

### 2. Implement in FileSystem Git Layer

**File:** `apps/code/src/layers/git/file-system.ts`

Add implementation (after `removeWorktree` around line 215):

```typescript
removeWorktreeKeepBranch: (sessionId: string): Effect.Effect<void, GitError> =>
  Effect.gen(function* () {
    const worktreeDir = getWorktreeDir(sessionId);

    // Check if worktree exists
    const exists = yield* directoryExists(worktreeDir);
    if (!exists) {
      return; // Already removed, nothing to do
    }

    // Remove worktree using git (keeps the branch)
    yield* gitExec(`git worktree remove "${worktreeDir}" --force`).pipe(
      Effect.mapError(
        (error) =>
          new GitError({
            message: `Failed to remove worktree: ${error.message}`,
            operation: "removeWorktreeKeepBranch",
            cause: error,
          })
      ),
      // If git worktree remove fails, try manual cleanup
      Effect.catchAll(() =>
        Effect.tryPromise({
          try: () => rm(worktreeDir, { recursive: true, force: true }),
          catch: (error) =>
            new GitError({
              message: `Failed to remove worktree directory: ${String(error)}`,
              operation: "removeWorktreeKeepBranch",
              cause: error,
            }),
        })
      )
    );

    // Prune worktree references
    yield* gitExec("git worktree prune").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );

    // NOTE: Branch is intentionally NOT deleted
  }),
```

### 3. Implement in Memory Git Layer

**File:** `apps/code/src/layers/git/memory.ts`

Add implementation to `createMemoryGitService` (after `removeWorktree` around line 83):

```typescript
removeWorktreeKeepBranch: (sessionId: string): Effect.Effect<void, GitError> =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef);
    // Remove worktree entry but simulate keeping branch
    // (In memory, we just remove the worktree state)
    state.delete(sessionId);
    yield* Ref.set(stateRef, state);
  }),
```

### 4. Call Method in Completion Stream

**File:** `apps/code/src/orchestrator/loop.ts`

Modify `createCompletionStream` function (around line 400-464):

Update the function signature to include proper git type:

```typescript
function createCompletionStream(
  sessionStore: {
    update: (id: string, session: Session) => Effect.Effect<void, unknown>;
  },
  git: {
    commitChanges: (
      sessionId: string,
      message: string
    ) => Effect.Effect<unknown, unknown>;
    removeWorktreeKeepBranch: (sessionId: string) => Effect.Effect<void, unknown>;
  },
  session: Session,
  config: LoopConfig,
  startTime: number,
  loopCompletedRef: Ref.Ref<boolean>,
  _worktreePath: WorktreePath
): Stream.Stream<DomainEvent, never, never> {
```

After the final commit (around line 433), add worktree cleanup:

```typescript
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
yield* git
  .removeWorktreeKeepBranch(session.id)
  .pipe(
    Effect.tapError((error) =>
      Effect.logDebug("Worktree cleanup failed, continuing", {
        sessionId: session.id,
        error: String(error),
      })
    ),
    Effect.orElseSucceed(() => undefined)
  );
```

### 5. Emit WorktreeRemoved Event

**File:** `apps/code/src/orchestrator/loop.ts`

In `createCompletionStream`, after worktree removal, emit the event.

Update the return to include the event:

```typescript
return Stream.unwrap(
  Effect.gen(function* () {
    const endTimeUtc = yield* DateTime.now;
    const endTime = DateTime.toEpochMillis(endTimeUtc);
    const durationMs = endTime - startTime;
    const completed = yield* Ref.get(loopCompletedRef);

    // Final commit
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

    // Remove worktree but keep branch
    yield* git
      .removeWorktreeKeepBranch(session.id)
      .pipe(
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

    // Session update
    yield* sessionStore
      .update(session.id, {
        ...session,
        status: completed ? "completed" : "paused",
        worktreePath: undefined, // Clear worktree path since it's removed
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
```

### 6. Add TUI Reducer for WorktreeRemoved

**File:** `apps/code/src/consumers/tui/reducers/worktree.ts`

Add reducer for the removed event:

```typescript
import type { WorktreeCreatedEvent, WorktreeRemovedEvent } from "../../../domain/index.js";
import { appendOutput } from "./helpers.js";
import type { StateReducer } from "./registry.js";
import { stateReducerRegistry } from "./registry.js";

const worktreeCreatedReducer: StateReducer<"WorktreeCreated"> = {
  tag: "WorktreeCreated",
  reduce: (state, event: WorktreeCreatedEvent) =>
    appendOutput(
      state,
      `\nWorktree created\n   Branch: ${event.branchName}\n   Path: ${event.worktreePath}\n`
    ),
};

const worktreeRemovedReducer: StateReducer<"WorktreeRemoved"> = {
  tag: "WorktreeRemoved",
  reduce: (state, event: WorktreeRemovedEvent) =>
    appendOutput(
      state,
      `\nWorktree cleaned up (branch preserved)\n   Session: ${event.sessionId}\n`
    ),
};

stateReducerRegistry.register(worktreeCreatedReducer);
stateReducerRegistry.register(worktreeRemovedReducer);
```

### 7. Add Headless Formatter for WorktreeRemoved

**File:** `apps/code/src/consumers/headless/formatters/worktree.ts`

Add formatter for the removed event:

```typescript
import pc from "picocolors";
import type { WorktreeCreatedEvent, WorktreeRemovedEvent } from "../../../domain/index.js";
import type { EventFormatter } from "./registry.js";
import { headlessFormatterRegistry } from "./registry.js";

const worktreeCreatedFormatter: EventFormatter<"WorktreeCreated"> = {
  tag: "WorktreeCreated",
  format: (event: WorktreeCreatedEvent) =>
    pc.cyan(
      `[WORKTREE] Branch: ${event.branchName} | Path: ${event.worktreePath}`
    ),
};

const worktreeRemovedFormatter: EventFormatter<"WorktreeRemoved"> = {
  tag: "WorktreeRemoved",
  format: (event: WorktreeRemovedEvent) =>
    pc.cyan(
      `[WORKTREE] Cleaned up worktree for session: ${event.sessionId} (branch preserved)`
    ),
};

headlessFormatterRegistry.register(worktreeCreatedFormatter);
headlessFormatterRegistry.register(worktreeRemovedFormatter);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/code/src/services/git.ts` | Add `removeWorktreeKeepBranch` to interface |
| `apps/code/src/layers/git/file-system.ts` | Implement `removeWorktreeKeepBranch` |
| `apps/code/src/layers/git/memory.ts` | Implement `removeWorktreeKeepBranch` for tests |
| `apps/code/src/orchestrator/loop.ts` | Call cleanup in `createCompletionStream`, emit event |
| `apps/code/src/consumers/tui/reducers/worktree.ts` | Add `WorktreeRemoved` reducer |
| `apps/code/src/consumers/headless/formatters/worktree.ts` | Add `WorktreeRemoved` formatter |

---

## Testing Plan

### Manual Testing

1. Run ferix on a task
2. Verify worktree is created at `.ferix/worktrees/{sessionId}/`
3. Wait for session to complete
4. Verify:
   - Worktree directory is removed
   - Branch `ferix/{sessionId}` still exists
   - `git log ferix/{sessionId}` shows commits
   - `git diff main..ferix/{sessionId}` shows changes
   - Console shows "Worktree cleaned up" message

### Edge Cases to Test

1. **Session fails mid-execution** - Worktree should remain (only cleanup on success)
2. **User manually deletes worktree** - Cleanup should handle gracefully (no error)
3. **Git worktree remove fails** - Fallback to `rm -rf` should work
4. **No changes in session** - Empty commit + cleanup should work

### Unit Tests

Add tests to verify:
- `removeWorktreeKeepBranch` removes directory but not branch
- Memory implementation works correctly
- Completion stream emits `WorktreeRemoved` event

---

## Rollback Plan

If issues arise:
1. Remove the `removeWorktreeKeepBranch` call from `createCompletionStream`
2. The existing `removeWorktree` method (which deletes the branch too) remains unchanged
3. Worktrees will accumulate again as before

---

## Future Considerations

1. **Configurable behavior** - Add config option to choose between keeping/deleting worktrees
2. **Cleanup command** - Add CLI command to clean up old worktrees: `ferix cleanup --sessions`
3. **Branch cleanup** - Add option to delete old branches: `ferix cleanup --branches --older-than 30d`
4. **Session resume** - If resuming a session, recreate worktree from branch if needed
