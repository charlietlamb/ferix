import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { GitError } from "../../src/commands/code/domain/errors.js";
import {
  type CommitHash,
  Git,
  type GitService,
  type PrUrl,
  type WorktreePath,
} from "../../src/commands/code/services/git.js";

/**
 * Creates a failing git layer for specific operations.
 */
function createFailingGitLayer(
  failingOperation: GitError["operation"],
  message: string
): Layer.Layer<Git> {
  const createError = (operation: GitError["operation"]) =>
    new GitError({ message, operation });

  const service: GitService = {
    createWorktree: (sessionId: string) =>
      failingOperation === "createWorktree"
        ? Effect.fail(createError("createWorktree"))
        : Effect.succeed(`.ferix/worktrees/${sessionId}` as WorktreePath),

    removeWorktree: () =>
      failingOperation === "removeWorktree"
        ? Effect.fail(createError("removeWorktree"))
        : Effect.succeed(undefined),

    removeWorktreeKeepBranch: () =>
      failingOperation === "removeWorktreeKeepBranch"
        ? Effect.fail(createError("removeWorktreeKeepBranch"))
        : Effect.succeed(undefined),

    getWorktreePath: (sessionId: string) =>
      Effect.succeed(`.ferix/worktrees/${sessionId}` as WorktreePath),

    commitChanges: () =>
      failingOperation === "commit"
        ? Effect.fail(createError("commit"))
        : Effect.succeed("abc123" as CommitHash),

    pushBranch: () =>
      failingOperation === "push"
        ? Effect.fail(createError("push"))
        : Effect.succeed(undefined),

    createPR: () =>
      failingOperation === "createPR"
        ? Effect.fail(createError("createPR"))
        : Effect.succeed("https://github.com/test/repo/pull/1" as PrUrl),

    getCurrentBranch: () =>
      failingOperation === "getCurrentBranch"
        ? Effect.fail(createError("getCurrentBranch"))
        : Effect.succeed("main"),

    renameBranch: (_sessionId: string, displayName: string) =>
      failingOperation === "renameBranch"
        ? Effect.fail(createError("renameBranch"))
        : Effect.succeed(`ferix/${displayName}`),

    getBranchName: (sessionId: string) => `ferix/${sessionId}`,
  };

  return Layer.succeed(Git, service);
}

describe("Git Error Paths", () => {
  describe("GitError construction", () => {
    it("should create GitError with correct properties", () => {
      const error = new GitError({
        message: "Failed to create worktree",
        operation: "createWorktree",
      });

      expect(error._tag).toBe("GitError");
      expect(error.message).toBe("Failed to create worktree");
      expect(error.operation).toBe("createWorktree");
    });

    it("should preserve cause in GitError", () => {
      const cause = new Error("Permission denied");
      const error = new GitError({
        message: "Git operation failed",
        operation: "commit",
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe("createWorktree failures", () => {
    it("should fail when worktree creation fails", async () => {
      const layer = createFailingGitLayer(
        "createWorktree",
        "Cannot create worktree: directory exists"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(GitError);
        expect((result.left as GitError).operation).toBe("createWorktree");
      }
    });

    it("should handle worktree already exists error", async () => {
      const layer = createFailingGitLayer(
        "createWorktree",
        "fatal: '.ferix/worktrees/session-1' already exists"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createWorktree("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).message).toContain("already exists");
      }
    });
  });

  describe("removeWorktree failures", () => {
    it("should fail when worktree removal fails", async () => {
      const layer = createFailingGitLayer(
        "removeWorktree",
        "Cannot remove worktree: uncommitted changes"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.removeWorktree("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe("removeWorktree");
        expect((result.left as GitError).message).toContain("uncommitted");
      }
    });

    it("should fail when removeWorktreeKeepBranch fails", async () => {
      const layer = createFailingGitLayer(
        "removeWorktreeKeepBranch",
        "Cannot remove worktree"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.removeWorktreeKeepBranch("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe(
          "removeWorktreeKeepBranch"
        );
      }
    });
  });

  describe("commit failures", () => {
    it("should fail when commit fails", async () => {
      const layer = createFailingGitLayer(
        "commit",
        "nothing to commit, working tree clean"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.commitChanges("session-1", "test commit");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe("commit");
      }
    });

    it("should handle pre-commit hook failure", async () => {
      const layer = createFailingGitLayer("commit", "pre-commit hook failed");

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.commitChanges("session-1", "test commit");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).message).toContain("pre-commit");
      }
    });
  });

  describe("push failures", () => {
    it("should fail when push fails", async () => {
      const layer = createFailingGitLayer("push", "failed to push some refs");

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.pushBranch("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe("push");
      }
    });

    it("should handle authentication failure", async () => {
      const layer = createFailingGitLayer("push", "Authentication failed");

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.pushBranch("session-1");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).message).toContain("Authentication");
      }
    });
  });

  describe("createPR failures", () => {
    it("should fail when PR creation fails", async () => {
      const layer = createFailingGitLayer(
        "createPR",
        "Pull request already exists"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createPR("session-1", "Title", "Body");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe("createPR");
      }
    });

    it("should handle missing remote", async () => {
      const layer = createFailingGitLayer("createPR", "No remote configured");

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.createPR("session-1", "Title", "Body");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).message).toContain("remote");
      }
    });
  });

  describe("getCurrentBranch failures", () => {
    it("should fail when not in a git repository", async () => {
      const layer = createFailingGitLayer(
        "getCurrentBranch",
        "fatal: not a git repository"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.getCurrentBranch();
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe("getCurrentBranch");
      }
    });
  });

  describe("renameBranch failures", () => {
    it("should fail when rename fails", async () => {
      const layer = createFailingGitLayer(
        "renameBranch",
        "Branch already exists"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.renameBranch("session-1", "new-name");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect((result.left as GitError).operation).toBe("renameBranch");
      }
    });
  });

  describe("Error recovery patterns", () => {
    it("should recover from createWorktree failure", async () => {
      const layer = createFailingGitLayer("createWorktree", "Cannot create");

      const program = Effect.gen(function* () {
        const git = yield* Git;
        return yield* git.createWorktree("session-1");
      }).pipe(
        Effect.catchTag("GitError", (error) =>
          error.operation === "createWorktree"
            ? Effect.succeed("/fallback/path" as WorktreePath)
            : Effect.fail(error)
        )
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe("/fallback/path");
    });

    it("should retry on transient failures", async () => {
      let attempts = 0;

      const service: GitService = {
        createWorktree: () =>
          Effect.gen(function* () {
            attempts++;
            if (attempts < 3) {
              return yield* Effect.fail(
                new GitError({
                  message: "Temporary failure",
                  operation: "createWorktree",
                })
              );
            }
            return ".ferix/worktrees/test" as WorktreePath;
          }),
        removeWorktree: () => Effect.succeed(undefined),
        removeWorktreeKeepBranch: () => Effect.succeed(undefined),
        getWorktreePath: () => Effect.succeed(undefined),
        commitChanges: () => Effect.succeed("abc" as CommitHash),
        pushBranch: () => Effect.succeed(undefined),
        createPR: () => Effect.succeed("url" as PrUrl),
        getCurrentBranch: () => Effect.succeed("main"),
        renameBranch: () => Effect.succeed("ferix/test"),
        getBranchName: () => "ferix/test",
      };

      const layer = Layer.succeed(Git, service);

      const program = Effect.gen(function* () {
        const git = yield* Git;
        return yield* git.createWorktree("test");
      }).pipe(Effect.retry({ times: 3 }));

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe(".ferix/worktrees/test");
      expect(attempts).toBe(3);
    });

    it("should map git errors to user-friendly messages", async () => {
      const layer = createFailingGitLayer(
        "push",
        "failed to push some refs to 'origin'"
      );

      const program = Effect.gen(function* () {
        const git = yield* Git;
        yield* git.pushBranch("session-1");
      }).pipe(
        Effect.mapError((error) => {
          if (error instanceof GitError && error.operation === "push") {
            return {
              type: "UserError" as const,
              message:
                "Unable to push changes. Please check your network connection and try again.",
            };
          }
          return { type: "UnknownError" as const, message: String(error) };
        })
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.type).toBe("UserError");
        expect(result.left.message).toContain("network connection");
      }
    });
  });
});
