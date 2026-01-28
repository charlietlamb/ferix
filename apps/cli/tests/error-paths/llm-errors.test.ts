import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import {
  GitError,
  LLMError,
  OrchestratorError,
  RetryExhaustedError,
  TokenBudgetError,
} from "../../src/commands/code/domain/errors.js";
import { LLM, type LLMService } from "../../src/commands/code/services/llm.js";

/**
 * Creates a failing LLM layer that always errors.
 */
function createFailingLLMLayer(
  error: Error = new Error("LLM API error")
): Layer.Layer<LLM> {
  return Layer.succeed(LLM, {
    stream: () =>
      Effect.fail(new LLMError({ message: error.message, cause: error })),
  } as LLMService);
}

describe("LLM Error Paths", () => {
  describe("LLMError construction", () => {
    it("should create LLMError with message", () => {
      const error = new LLMError({ message: "API rate limited" });

      expect(error._tag).toBe("LLMError");
      expect(error.message).toBe("API rate limited");
      expect(error.cause).toBeUndefined();
    });

    it("should create LLMError with cause", () => {
      const cause = new Error("Network timeout");
      const error = new LLMError({
        message: "Failed to connect",
        cause,
      });

      expect(error._tag).toBe("LLMError");
      expect(error.message).toBe("Failed to connect");
      expect(error.cause).toBe(cause);
    });
  });

  describe("OrchestratorError construction", () => {
    it("should create OrchestratorError with phase", () => {
      const error = new OrchestratorError({
        message: "Discovery failed",
        phase: "discovery",
      });

      expect(error._tag).toBe("OrchestratorError");
      expect(error.message).toBe("Discovery failed");
      expect(error.phase).toBe("discovery");
    });

    it("should create OrchestratorError for each phase", () => {
      const phases = ["setup", "discovery", "iteration", "cleanup"] as const;

      for (const phase of phases) {
        const error = new OrchestratorError({
          message: `Error in ${phase}`,
          phase,
        });

        expect(error.phase).toBe(phase);
      }
    });
  });

  describe("TokenBudgetError construction", () => {
    it("should create TokenBudgetError with budget details", () => {
      const error = new TokenBudgetError({
        message: "Token budget exceeded",
        budgetUsed: 150_000,
        budgetMax: 100_000,
        overflowSections: ["context", "history"],
      });

      expect(error._tag).toBe("TokenBudgetError");
      expect(error.budgetUsed).toBe(150_000);
      expect(error.budgetMax).toBe(100_000);
      expect(error.overflowSections).toEqual(["context", "history"]);
    });
  });

  describe("RetryExhaustedError construction", () => {
    it("should create RetryExhaustedError with attempt details", () => {
      const error = new RetryExhaustedError({
        message: "All retries exhausted",
        attempts: 3,
        finalError: "Connection refused",
        iteration: 5,
      });

      expect(error._tag).toBe("RetryExhaustedError");
      expect(error.attempts).toBe(3);
      expect(error.finalError).toBe("Connection refused");
      expect(error.iteration).toBe(5);
    });
  });

  describe("LLM stream failures", () => {
    it("should propagate LLM stream errors", async () => {
      const layer = createFailingLLMLayer(new Error("API rate limit exceeded"));

      const program = Effect.gen(function* () {
        const llm = yield* LLM;
        yield* llm.stream({ prompt: "Test", model: "test-model" });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer), Effect.either)
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(LLMError);
        expect((result.left as LLMError).message).toBe(
          "API rate limit exceeded"
        );
      }
    });

    it("should handle different LLM error types", async () => {
      const errorTypes = [
        { error: new Error("Rate limited"), expected: "Rate limited" },
        { error: new Error("Invalid API key"), expected: "Invalid API key" },
        { error: new Error("Model not found"), expected: "Model not found" },
        {
          error: new Error("Context length exceeded"),
          expected: "Context length exceeded",
        },
      ];

      for (const { error, expected } of errorTypes) {
        const layer = createFailingLLMLayer(error);

        const program = Effect.gen(function* () {
          const llm = yield* LLM;
          yield* llm.stream({ prompt: "Test", model: "test-model" });
        });

        const result = await Effect.runPromise(
          program.pipe(Effect.provide(layer), Effect.either)
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect((result.left as LLMError).message).toBe(expected);
        }
      }
    });
  });

  describe("GitError construction", () => {
    it("should create GitError for each operation type", () => {
      const operations = [
        "createWorktree",
        "removeWorktree",
        "removeWorktreeKeepBranch",
        "commit",
        "push",
        "createPR",
        "renameBranch",
        "branchLookup",
        "getCurrentBranch",
        "status",
      ] as const;

      for (const operation of operations) {
        const error = new GitError({
          message: `Git ${operation} failed`,
          operation,
        });

        expect(error._tag).toBe("GitError");
        expect(error.operation).toBe(operation);
      }
    });

    it("should preserve cause in GitError", () => {
      const cause = new Error("Permission denied");
      const error = new GitError({
        message: "Cannot create worktree",
        operation: "createWorktree",
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe("Error recovery patterns", () => {
    it("should allow catching and mapping LLMError", async () => {
      const layer = createFailingLLMLayer(new Error("API error"));

      const program = Effect.gen(function* () {
        const llm = yield* LLM;
        yield* llm.stream({ prompt: "Test", model: "test-model" });
      }).pipe(
        Effect.catchTag("LLMError", (error) =>
          Effect.succeed(`Recovered from: ${error.message}`)
        )
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe("Recovered from: API error");
    });

    it("should allow fallback on LLMError", async () => {
      const layer = createFailingLLMLayer(new Error("Primary API failed"));

      const program = Effect.gen(function* () {
        const llm = yield* LLM;
        yield* llm.stream({ prompt: "Test", model: "test-model" });
        return "success";
      }).pipe(Effect.catchTag("LLMError", () => Effect.succeed("fallback")));

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(layer))
      );

      expect(result).toBe("fallback");
    });
  });
});
