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
 * Error that occurs during orchestrator execution.
 */
export class OrchestratorError extends Data.TaggedError("OrchestratorError")<{
  readonly message: string;
  readonly phase: "setup" | "iteration" | "cleanup";
  readonly cause?: unknown;
}> {}

/**
 * Union of all possible errors in the system.
 */
export type FerixError =
  | LLMError
  | ParseError
  | PlanStoreError
  | SessionStoreError
  | OrchestratorError;
