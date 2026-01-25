import { Effect, Layer, Ref } from "effect";
import { GitError } from "../../domain/errors.js";
import {
  type CommitHash,
  Git,
  type GitService,
  type PrUrl,
  type WorktreePath,
} from "../../services/git.js";

/**
 * In-memory worktree state.
 */
interface WorktreeState {
  readonly path: WorktreePath;
  readonly branch: string;
  readonly commits: string[];
}

/**
 * In-memory git store type.
 */
type GitStoreState = Map<string, WorktreeState>;

/**
 * Branch prefix for ferix sessions.
 */
const BRANCH_PREFIX = "ferix";

/**
 * Get the branch name for a session.
 */
function getBranchName(sessionId: string): string {
  return `${BRANCH_PREFIX}/${sessionId}`;
}

/**
 * Creates an in-memory git service.
 *
 * Useful for testing without actual git operations.
 *
 * @param stateRef - Reference to the git store state
 * @param commitCounterRef - Reference to the commit counter
 */
function createMemoryGitService(
  stateRef: Ref.Ref<GitStoreState>,
  commitCounterRef: Ref.Ref<number>
): GitService {
  return {
    createWorktree: (
      sessionId: string,
      _baseBranch?: string
    ): Effect.Effect<WorktreePath, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);

        // Check if already exists
        const existing = state.get(sessionId);
        if (existing) {
          return existing.path;
        }

        const path = `.ferix/worktrees/${sessionId}` as WorktreePath;
        const branch = getBranchName(sessionId);

        const worktree: WorktreeState = {
          path,
          branch,
          commits: [],
        };

        state.set(sessionId, worktree);
        yield* Ref.set(stateRef, state);

        return path;
      }),

    removeWorktree: (sessionId: string): Effect.Effect<void, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        state.delete(sessionId);
        yield* Ref.set(stateRef, state);
      }),

    removeWorktreeKeepBranch: (
      sessionId: string
    ): Effect.Effect<void, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        // Remove worktree entry but simulate keeping branch
        // (In memory, we just remove the worktree state)
        state.delete(sessionId);
        yield* Ref.set(stateRef, state);
      }),

    getWorktreePath: (
      sessionId: string
    ): Effect.Effect<WorktreePath | undefined, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const worktree = state.get(sessionId);
        return worktree?.path;
      }),

    commitChanges: (
      sessionId: string,
      message: string
    ): Effect.Effect<CommitHash, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const worktree = state.get(sessionId);

        if (!worktree) {
          return yield* Effect.fail(
            new GitError({
              message: `Worktree not found for session: ${sessionId}`,
              operation: "commit",
            })
          );
        }

        const counter = yield* Ref.updateAndGet(commitCounterRef, (n) => n + 1);
        const hash = `test-commit-${counter}` as CommitHash;

        const updatedWorktree: WorktreeState = {
          ...worktree,
          commits: [...worktree.commits, `${hash}: ${message}`],
        };

        state.set(sessionId, updatedWorktree);
        yield* Ref.set(stateRef, state);

        return hash;
      }),

    pushBranch: (sessionId: string): Effect.Effect<void, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const worktree = state.get(sessionId);

        if (!worktree) {
          return yield* Effect.fail(
            new GitError({
              message: `Worktree not found for session: ${sessionId}`,
              operation: "push",
            })
          );
        }

        // In memory, push is a no-op
      }),

    createPR: (
      sessionId: string,
      title: string,
      _body: string
    ): Effect.Effect<PrUrl, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const worktree = state.get(sessionId);

        if (!worktree) {
          return yield* Effect.fail(
            new GitError({
              message: `Worktree not found for session: ${sessionId}`,
              operation: "createPR",
            })
          );
        }

        // Return a fake PR URL
        const slug = title.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
        return `https://github.com/test/repo/pull/${slug}` as PrUrl;
      }),

    renameBranch: (
      sessionId: string,
      displayName: string
    ): Effect.Effect<string, GitError> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const worktree = state.get(sessionId);

        if (!worktree) {
          return yield* Effect.fail(
            new GitError({
              message: `Worktree not found for session: ${sessionId}`,
              operation: "renameBranch",
            })
          );
        }

        const newBranchName = `${BRANCH_PREFIX}/${displayName}`;

        // Update the worktree state with new branch name
        const updatedWorktree: WorktreeState = {
          ...worktree,
          branch: newBranchName,
        };

        state.set(sessionId, updatedWorktree);
        yield* Ref.set(stateRef, state);

        return newBranchName;
      }),

    getBranchName,
  };
}

/**
 * Creates a Layer for an in-memory git service.
 *
 * Each call creates a new isolated store.
 *
 * @example
 * ```typescript
 * const testLayer = MemoryGit.layer();
 *
 * const program = Effect.gen(function* () {
 *   const git = yield* Git;
 *   const path = yield* git.createWorktree("test-session");
 *   return path;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(testLayer)));
 * ```
 */
export function layer(): Layer.Layer<Git> {
  return Layer.effect(
    Git,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make<GitStoreState>(new Map());
      const commitCounterRef = yield* Ref.make(0);
      return createMemoryGitService(stateRef, commitCounterRef);
    })
  );
}

/**
 * Default Live Layer for in-memory git service.
 *
 * Note: State is shared across all uses of this layer.
 * For isolated testing, use `MemoryGit.layer()` instead.
 */
export const Live = layer();

/**
 * MemoryGit namespace containing the Live layer and factory.
 */
export const MemoryGit = {
  Live,
  layer,
} as const;
