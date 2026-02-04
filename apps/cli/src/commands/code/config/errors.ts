import { Data } from "effect";

/**
 * Error that occurs during ferix.json config file operations.
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly operation: "read" | "parse" | "validate";
  readonly cause?: unknown;
}> {}
