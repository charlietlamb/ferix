import { Data } from "effect";

/**
 * Error reading or parsing package.json.
 */
export class PackageJsonError extends Data.TaggedError("PackageJsonError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

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
 * Error resolving package from npm registry.
 */
export class NpmResolveError extends Data.TaggedError("NpmResolveError")<{
  readonly message: string;
  readonly packageName: string;
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

/**
 * Union of all sync-related errors.
 */
export type SyncError =
  | PackageJsonError
  | SchemaValidationError
  | ConvexError
  | NpmResolveError
  | SkillInstallError;
