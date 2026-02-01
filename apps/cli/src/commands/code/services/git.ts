import { Context, type Effect } from "effect";
import type { GitError } from "../domain/errors.js";

/**
 * Branded type for worktree paths.
 */
export type WorktreePath = string & { readonly _brand: "WorktreePath" };

/**
 * Branded type for commit hashes.
 */
export type CommitHash = string & { readonly _brand: "CommitHash" };

/**
 * Branded type for PR URLs.
 */
export type PrUrl = string & { readonly _brand: "PrUrl" };

/**
 * Service interface for git operations.
 *
 * Provides worktree management for isolated session execution.
 * Each session runs in its own worktree with a dedicated branch.
 *
 * @example
 * ```typescript
 * const git = yield* Git;
 *
 * // Create worktree for a session
 * const worktreePath = yield* git.createWorktree("calm-snails-dream-123");
 *
 * // Execute work in worktree...
 *
 * // Commit changes
 * yield* git.commitChanges("calm-snails-dream-123", "feat: complete task 1");
 *
 * // Cleanup when done
 * yield* git.removeWorktree("calm-snails-dream-123");
 * ```
 */
export interface GitService {
  /**
   * Create a new worktree for a session.
   *
   * Creates a worktree at `.ferix/worktrees/{sessionId}` with a new branch
   * `ferix/{sessionId}` based on the current HEAD or specified base branch.
   *
   * @param sessionId - Session ID to create worktree for
   * @param baseBranch - Optional branch to base the worktree on (defaults to HEAD)
   * @returns Path to the created worktree
   */
  readonly createWorktree: (
    sessionId: string,
    baseBranch?: string
  ) => Effect.Effect<WorktreePath, GitError>;

  /**
   * Remove a worktree for a session.
   *
   * Removes the worktree directory and cleans up git references.
   *
   * @param sessionId - Session ID whose worktree to remove
   */
  readonly removeWorktree: (sessionId: string) => Effect.Effect<void, GitError>;

  /**
   * Get the worktree path for a session if it exists.
   *
   * @param sessionId - Session ID to check
   * @returns Worktree path if exists, undefined otherwise
   */
  readonly getWorktreePath: (
    sessionId: string
  ) => Effect.Effect<WorktreePath | undefined, GitError>;

  /**
   * Commit all changes in a session's worktree.
   *
   * Stages all changes and creates a commit with the given message.
   *
   * @param sessionId - Session ID whose worktree to commit
   * @param message - Commit message
   * @returns The commit hash
   */
  readonly commitChanges: (
    sessionId: string,
    message: string
  ) => Effect.Effect<CommitHash, GitError>;

  /**
   * Push the session's branch to the remote.
   *
   * @param sessionId - Session ID whose branch to push
   */
  readonly pushBranch: (sessionId: string) => Effect.Effect<void, GitError>;

  /**
   * Create a pull request for the session's branch.
   *
   * Uses `gh` CLI to create a PR.
   *
   * @param sessionId - Session ID whose branch to create PR for
   * @param title - PR title
   * @param body - PR body/description
   * @param baseBranch - Optional base branch for the PR (defaults to repo default)
   * @returns URL of the created PR
   */
  readonly createPR: (
    sessionId: string,
    title: string,
    body: string,
    baseBranch?: string
  ) => Effect.Effect<PrUrl, GitError>;

  /**
   * Get the current branch name of the main repository.
   *
   * Used to capture the base branch when starting a session.
   *
   * @returns The current branch name
   */
  readonly getCurrentBranch: () => Effect.Effect<string, GitError>;

  /**
   * Get the branch name for a session.
   *
   * @param sessionId - Session ID
   * @returns Branch name (e.g., "ferix/calm-snails-dream-123")
   */
  readonly getBranchName: (sessionId: string) => string;

  /**
   * Remove a worktree but keep its branch.
   *
   * Removes the worktree directory and cleans up git worktree references,
   * but preserves the branch for user review and merge.
   *
   * @param sessionId - Session ID whose worktree to remove
   */
  readonly removeWorktreeKeepBranch: (
    sessionId: string
  ) => Effect.Effect<void, GitError>;

  /**
   * Rename a session's branch to use a descriptive display name.
   *
   * This is called after discovery phase when the LLM generates a
   * task-based name for the session.
   *
   * @param sessionId - Session ID whose branch to rename
   * @param displayName - New display name for the branch (kebab-case)
   * @returns The new branch name (e.g., "ferix/add-dark-mode")
   */
  readonly renameBranch: (
    sessionId: string,
    displayName: string
  ) => Effect.Effect<string, GitError>;

  /**
   * Push a branch to the remote by branch name.
   *
   * Unlike pushBranch which requires a worktree, this works directly
   * with the branch name from the main repository.
   *
   * @param branchName - Full branch name (e.g., "ferix/add-dark-mode")
   */
  readonly pushBranchByName: (
    branchName: string
  ) => Effect.Effect<void, GitError>;

  /**
   * Create a pull request for a branch by branch name.
   *
   * Unlike createPR which requires a worktree, this works directly
   * with the branch name from the main repository.
   *
   * @param branchName - Full branch name (e.g., "ferix/add-dark-mode")
   * @param title - PR title
   * @param body - PR body/description
   * @param baseBranch - Optional base branch for the PR (defaults to repo default)
   * @returns URL of the created PR
   */
  readonly createPRByBranchName: (
    branchName: string,
    title: string,
    body: string,
    baseBranch?: string
  ) => Effect.Effect<PrUrl, GitError>;
}

/**
 * Effect Tag for the Git service.
 *
 * Use this tag to depend on git operations without coupling to a specific implementation.
 */
export class Git extends Context.Tag("@ferix/Git")<Git, GitService>() {}
