import { Data } from "effect";

/**
 * Error that occurs during LLM execution.
 */
export class LLMError extends Data.TaggedError("LLMError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs when parsing signals from LLM output.
 */
export class ParseError extends Data.TaggedError("ParseError")<{
  readonly message: string;
  readonly input?: string;
}> {}

/**
 * Error that occurs during plan storage operations.
 */
export class PlanStoreError extends Data.TaggedError("PlanStoreError")<{
  readonly message: string;
  readonly operation: "create" | "load" | "update" | "list";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during session storage operations.
 */
export class SessionStoreError extends Data.TaggedError("SessionStoreError")<{
  readonly message: string;
  readonly operation: "create" | "get" | "update";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during progress storage operations.
 */
export class ProgressStoreError extends Data.TaggedError("ProgressStoreError")<{
  readonly message: string;
  readonly operation: "append" | "load" | "getRecent";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during guardrails storage operations.
 */
export class GuardrailsStoreError extends Data.TaggedError(
  "GuardrailsStoreError"
)<{
  readonly message: string;
  readonly operation: "add" | "load" | "getActive";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during orchestrator execution.
 */
export class OrchestratorError extends Data.TaggedError("OrchestratorError")<{
  readonly message: string;
  readonly phase: "setup" | "discovery" | "iteration" | "cleanup";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs during git operations.
 */
export class GitError extends Data.TaggedError("GitError")<{
  readonly message: string;
  readonly operation:
    | "createWorktree"
    | "removeWorktree"
    | "removeWorktreeKeepBranch"
    | "commit"
    | "push"
    | "createPR"
    | "renameBranch"
    | "branchLookup"
    | "getCurrentBranch"
    | "status";
  readonly cause?: unknown;
}> {}

/**
 * Error that occurs when token budget is exceeded.
 */
export class TokenBudgetError extends Data.TaggedError("TokenBudgetError")<{
  readonly message: string;
  /** Total tokens used */
  readonly budgetUsed: number;
  /** Maximum tokens available */
  readonly budgetMax: number;
  /** Sections that couldn't fit */
  readonly overflowSections: readonly string[];
}> {}

/**
 * Error that occurs when all retry attempts are exhausted.
 */
export class RetryExhaustedError extends Data.TaggedError(
  "RetryExhaustedError"
)<{
  readonly message: string;
  /** Number of attempts made */
  readonly attempts: number;
  /** The final error that caused failure */
  readonly finalError: string;
  /** Iteration where retries were exhausted */
  readonly iteration: number;
}> {}
