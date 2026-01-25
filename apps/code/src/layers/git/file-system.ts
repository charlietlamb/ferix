import { exec } from "node:child_process";
import {
  access,
  appendFile,
  copyFile,
  mkdir,
  readFile,
  rm,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { Effect, Layer } from "effect";
import { GitError } from "../../domain/errors.js";
import {
  type CommitHash,
  Git,
  type GitService,
  type PrUrl,
  type WorktreePath,
} from "../../services/git.js";

const execAsync = promisify(exec);

/**
 * Base directory for worktrees.
 */
const WORKTREES_DIR = ".ferix/worktrees";

/**
 * Regex to parse gitdir from worktree .git file.
 * Format: "gitdir: /path/to/.git/worktrees/sessionId"
 */
const GITDIR_REGEX = /^gitdir:\s*(.+)$/m;

/**
 * Branch prefix for ferix sessions.
 */
const BRANCH_PREFIX = "ferix";

/**
 * Get the worktree directory path for a session.
 */
function getWorktreeDir(sessionId: string): string {
  return join(process.cwd(), WORKTREES_DIR, sessionId);
}

/**
 * Get the branch name for a session.
 */
function getBranchName(sessionId: string): string {
  return `${BRANCH_PREFIX}/${sessionId}`;
}

/**
 * Execute a git command and return stdout.
 */
function gitExec(
  command: string,
  cwd?: string
): Effect.Effect<string, GitError> {
  return Effect.tryPromise({
    try: async () => {
      const { stdout } = await execAsync(command, { cwd });
      return stdout.trim();
    },
    catch: (error) => {
      const execError = error as { stderr?: string; message?: string };
      return new GitError({
        message: execError.stderr || execError.message || String(error),
        operation: "status",
        cause: error,
      });
    },
  });
}

/**
 * Check if a directory exists.
 */
function directoryExists(dirPath: string): Effect.Effect<boolean, never> {
  return Effect.tryPromise({
    try: async () => {
      await access(dirPath);
      return true;
    },
    catch: () => new Error("Directory does not exist"),
  }).pipe(Effect.orElseSucceed(() => false));
}

/**
 * Check if a branch exists.
 */
function branchExists(branchName: string): Effect.Effect<boolean, never> {
  return gitExec(`git rev-parse --verify refs/heads/${branchName}`).pipe(
    Effect.map(() => true),
    Effect.orElseSucceed(() => false)
  );
}

/**
 * Find an available branch name by appending a counter if needed.
 * Returns the first available name: baseName, baseName-2, baseName-3, etc.
 */
function findAvailableBranchName(
  baseName: string,
  maxAttempts = 100
): Effect.Effect<string, GitError> {
  const tryName = (
    name: string,
    attempt: number
  ): Effect.Effect<string, GitError> =>
    Effect.gen(function* () {
      const exists = yield* branchExists(name);
      if (!exists) {
        return name;
      }
      if (attempt >= maxAttempts) {
        return yield* Effect.fail(
          new GitError({
            message: `Could not find available branch name after ${maxAttempts} attempts`,
            operation: "branchLookup",
          })
        );
      }
      return yield* tryName(`${baseName}-${attempt + 1}`, attempt + 1);
    });

  return tryName(baseName, 1);
}

/**
 * Copy untracked files from the main working directory to the worktree.
 * This ensures user-created files (like cleanup.md, prd.md) are available in the worktree.
 * Respects .gitignore via --exclude-standard flag.
 * Also adds copied files to the worktree's exclude list so they remain untracked.
 */
function copyUntrackedFiles(
  worktreeDir: string
): Effect.Effect<void, GitError> {
  return Effect.gen(function* () {
    // Get list of untracked files (respects .gitignore via --exclude-standard)
    const untrackedOutput = yield* gitExec(
      "git ls-files --others --exclude-standard"
    ).pipe(Effect.catchAll(() => Effect.succeed("")));

    const untrackedFiles = untrackedOutput
      .split("\n")
      .filter((f) => f.length > 0)
      .filter((f) => !f.startsWith(".ferix/")); // Exclude internal ferix files

    if (untrackedFiles.length === 0) {
      return;
    }

    // Copy each untracked file to the worktree
    for (const file of untrackedFiles) {
      const srcPath = join(process.cwd(), file);
      const destPath = join(worktreeDir, file);

      yield* Effect.tryPromise({
        try: async () => {
          // Ensure destination directory exists
          await mkdir(dirname(destPath), { recursive: true });
          // Copy file
          await copyFile(srcPath, destPath);
        },
        catch: () =>
          new GitError({
            message: `Failed to copy untracked file: ${file}`,
            operation: "createWorktree",
          }),
      }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    }

    // Add copied files to worktree's local exclude file so they remain untracked.
    // Worktrees have a .git file that points to the actual git dir, we need to resolve it.
    yield* Effect.tryPromise({
      try: async () => {
        // Read the .git file to find the actual git directory
        const gitFilePath = join(worktreeDir, ".git");
        const gitFileContent = await readFile(gitFilePath, "utf-8");
        const gitDirMatch = gitFileContent.match(GITDIR_REGEX);
        const gitDirPath = gitDirMatch?.[1]?.trim();
        if (!gitDirPath) {
          return; // Can't find git dir, skip exclude update
        }

        const gitDir = gitDirPath;
        const excludePath = join(gitDir, "info", "exclude");

        // Ensure info directory exists
        await mkdir(dirname(excludePath), { recursive: true });

        // Build exclude content with header comment
        const excludeContent =
          "\n# Untracked files copied from main worktree (auto-generated by ferix)\n" +
          untrackedFiles.join("\n") +
          "\n";

        // Append to exclude file
        await appendFile(excludePath, excludeContent);
      },
      catch: () =>
        new GitError({
          message: "Failed to update exclude file for copied untracked files",
          operation: "createWorktree",
        }),
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
  });
}

/**
 * File system git service implementation.
 *
 * Uses git CLI for worktree operations.
 */
const make: GitService = {
  createWorktree: (
    sessionId: string,
    baseBranch?: string
  ): Effect.Effect<WorktreePath, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);
      const branchName = getBranchName(sessionId);

      // Ensure worktrees directory exists
      const worktreesBase = join(process.cwd(), WORKTREES_DIR);
      yield* Effect.tryPromise({
        try: () => mkdir(worktreesBase, { recursive: true }),
        catch: (error) =>
          new GitError({
            message: `Failed to create worktrees directory: ${String(error)}`,
            operation: "createWorktree",
            cause: error,
          }),
      });

      // Check if worktree already exists
      const exists = yield* directoryExists(worktreeDir);
      if (exists) {
        return worktreeDir as WorktreePath;
      }

      // Create worktree with new branch
      const baseRef = baseBranch || "HEAD";
      const command = `git worktree add "${worktreeDir}" -b "${branchName}" ${baseRef}`;

      yield* gitExec(command).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to create worktree: ${error.message}`,
              operation: "createWorktree",
              cause: error,
            })
        )
      );

      // Copy untracked files to the worktree
      yield* copyUntrackedFiles(worktreeDir);

      return worktreeDir as WorktreePath;
    }),

  removeWorktree: (sessionId: string): Effect.Effect<void, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);
      const branchName = getBranchName(sessionId);

      // Check if worktree exists
      const exists = yield* directoryExists(worktreeDir);
      if (!exists) {
        return;
      }

      // Remove worktree using git
      yield* gitExec(`git worktree remove "${worktreeDir}" --force`).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to remove worktree: ${error.message}`,
              operation: "removeWorktree",
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
                operation: "removeWorktree",
                cause: error,
              }),
          })
        )
      );

      // Try to delete the branch (may fail if not merged, that's ok)
      yield* gitExec(`git branch -D "${branchName}"`).pipe(
        Effect.catchAll(() => Effect.succeed(undefined))
      );

      // Prune worktree references
      yield* gitExec("git worktree prune").pipe(
        Effect.catchAll(() => Effect.succeed(undefined))
      );
    }),

  removeWorktreeKeepBranch: (
    sessionId: string
  ): Effect.Effect<void, GitError> =>
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

  getWorktreePath: (
    sessionId: string
  ): Effect.Effect<WorktreePath | undefined, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);
      const exists = yield* directoryExists(worktreeDir);
      return exists ? (worktreeDir as WorktreePath) : undefined;
    }),

  commitChanges: (
    sessionId: string,
    message: string
  ): Effect.Effect<CommitHash, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);

      // Check if worktree exists
      const exists = yield* directoryExists(worktreeDir);
      if (!exists) {
        return yield* Effect.fail(
          new GitError({
            message: `Worktree not found for session: ${sessionId}`,
            operation: "commit",
          })
        );
      }

      // Stage all changes
      yield* gitExec("git add -A", worktreeDir).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to stage changes: ${error.message}`,
              operation: "commit",
              cause: error,
            })
        )
      );

      // Check if there are changes to commit
      const status = yield* gitExec("git status --porcelain", worktreeDir).pipe(
        Effect.catchAll(() => Effect.succeed(""))
      );

      if (!status) {
        // No changes to commit, return current HEAD
        const head = yield* gitExec("git rev-parse HEAD", worktreeDir).pipe(
          Effect.mapError(
            (error) =>
              new GitError({
                message: `Failed to get HEAD: ${error.message}`,
                operation: "commit",
                cause: error,
              })
          )
        );
        return head as CommitHash;
      }

      // Escape message for shell
      const escapedMessage = message.replace(/"/g, '\\"');

      // Commit changes
      yield* gitExec(`git commit -m "${escapedMessage}"`, worktreeDir).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to commit: ${error.message}`,
              operation: "commit",
              cause: error,
            })
        )
      );

      // Get commit hash
      const hash = yield* gitExec("git rev-parse HEAD", worktreeDir).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to get commit hash: ${error.message}`,
              operation: "commit",
              cause: error,
            })
        )
      );

      return hash as CommitHash;
    }),

  pushBranch: (sessionId: string): Effect.Effect<void, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);

      // Check if worktree exists
      const exists = yield* directoryExists(worktreeDir);
      if (!exists) {
        return yield* Effect.fail(
          new GitError({
            message: `Worktree not found for session: ${sessionId}`,
            operation: "push",
          })
        );
      }

      // Push current branch to origin (uses HEAD to work correctly after branch rename)
      yield* gitExec("git push -u origin HEAD", worktreeDir).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to push branch: ${error.message}`,
              operation: "push",
              cause: error,
            })
        )
      );
    }),

  createPR: (
    sessionId: string,
    title: string,
    body: string
  ): Effect.Effect<PrUrl, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);

      // Check if worktree exists
      const exists = yield* directoryExists(worktreeDir);
      if (!exists) {
        return yield* Effect.fail(
          new GitError({
            message: `Worktree not found for session: ${sessionId}`,
            operation: "createPR",
          })
        );
      }

      // Escape title and body for shell
      const escapedTitle = title.replace(/"/g, '\\"');
      const escapedBody = body.replace(/"/g, '\\"');

      // Create PR using gh CLI
      const prUrl = yield* gitExec(
        `gh pr create --title "${escapedTitle}" --body "${escapedBody}"`,
        worktreeDir
      ).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to create PR: ${error.message}`,
              operation: "createPR",
              cause: error,
            })
        )
      );

      return prUrl as PrUrl;
    }),

  renameBranch: (
    sessionId: string,
    displayName: string
  ): Effect.Effect<string, GitError> =>
    Effect.gen(function* () {
      const worktreeDir = getWorktreeDir(sessionId);
      const oldBranchName = getBranchName(sessionId);

      // Check if worktree exists
      const exists = yield* directoryExists(worktreeDir);
      if (!exists) {
        return yield* Effect.fail(
          new GitError({
            message: `Worktree not found for session: ${sessionId}`,
            operation: "renameBranch",
          })
        );
      }

      // Find an available branch name (handles collisions)
      const desiredName = `${BRANCH_PREFIX}/${displayName}`;
      const newBranchName = yield* findAvailableBranchName(desiredName);

      // Rename the branch (from within the worktree)
      yield* gitExec(
        `git branch -m "${oldBranchName}" "${newBranchName}"`,
        worktreeDir
      ).pipe(
        Effect.mapError(
          (error) =>
            new GitError({
              message: `Failed to rename branch: ${error.message}`,
              operation: "renameBranch",
              cause: error,
            })
        )
      );

      return newBranchName;
    }),

  getBranchName,
};

/**
 * Live Layer for the file system git service.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const git = yield* Git;
 *   const worktreePath = yield* git.createWorktree("session-123");
 *   return worktreePath;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemGit.Live)));
 * ```
 */
export const Live = Layer.succeed(Git, make);

/**
 * FileSystemGit namespace containing the Live layer.
 */
export const FileSystemGit = {
  Live,
} as const;
