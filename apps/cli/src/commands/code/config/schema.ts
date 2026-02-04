import { Schema as S } from "effect";
import { ProviderNameSchema } from "../domain/schemas/config.js";

/**
 * Schema for phase-specific prompt overrides in ferix.json.
 */
const FilePhasePromptOverridesSchema = S.Struct({
  breakdown: S.optional(S.String),
  planning: S.optional(S.String),
  execution: S.optional(S.String),
  check: S.optional(S.String),
  verify: S.optional(S.String),
  review: S.optional(S.String),
  completion: S.optional(S.String),
});

/**
 * Schema for prompt configuration in ferix.json.
 */
const FilePromptConfigSchema = S.Struct({
  systemPrompt: S.optional(S.String),
  phases: S.optional(FilePhasePromptOverridesSchema),
  additionalContext: S.optional(S.String),
});

/**
 * Schema for the ferix.json configuration file.
 *
 * All fields are optional since ferix.json provides defaults
 * that can be overridden by CLI flags.
 */
export const FerixConfigSchema = S.Struct({
  /** Default maximum iterations per session. */
  iterations: S.optional(S.Number),
  /** Default verification commands to run after task completion. */
  verify: S.optional(S.Array(S.String)),
  /** Default git branch name pattern. */
  branch: S.optional(S.String),
  /** Whether to push branch after completion by default. */
  push: S.optional(S.Boolean),
  /** Whether to create PR after pushing by default. */
  pr: S.optional(S.Boolean),
  /** Default LLM provider. */
  provider: S.optional(ProviderNameSchema),
  /** Whether to skip permission prompts by default. */
  yolo: S.optional(S.Boolean),
  /** Whether to enable debug logging by default. */
  debug: S.optional(S.Boolean),
  /** Default prompt configuration. */
  prompts: S.optional(FilePromptConfigSchema),
});
export type FerixConfig = typeof FerixConfigSchema.Type;
