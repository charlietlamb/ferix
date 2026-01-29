import { Data } from "effect";

/**
 * Error when schema validation fails.
 */
export class SchemaValidationError extends Data.TaggedError(
  "SchemaValidationError"
)<{
  readonly message: string;
  readonly context: string;
  readonly cause?: unknown;
}> {}

/**
 * Error communicating with the Convex backend.
 */
export class ConvexError extends Data.TaggedError("ConvexError")<{
  readonly message: string;
  readonly operation: "resolveOrgs" | "findSkills";
  readonly cause?: unknown;
}> {}

/**
 * Error installing skills via npx.
 */
export class SkillInstallError extends Data.TaggedError("SkillInstallError")<{
  readonly message: string;
  readonly repo: string;
  readonly cause?: unknown;
}> {}
