import { Schema as S } from "effect";

/**
 * Supported LLM provider names.
 */
export const ProviderNameSchema = S.Literal("claude", "cursor", "opencode");
export type ProviderName = typeof ProviderNameSchema.Type;

const PhasePromptOverridesSchema = S.Struct({
  breakdown: S.optional(S.String),
  planning: S.optional(S.String),
  execution: S.optional(S.String),
  check: S.optional(S.String),
  verify: S.optional(S.String),
  review: S.optional(S.String),
  completion: S.optional(S.String),
});

const PromptConfigSchema = S.Struct({
  systemPrompt: S.optional(S.String),
  phases: S.optional(PhasePromptOverridesSchema),
  additionalContext: S.optional(S.String),
});
export type PromptConfig = typeof PromptConfigSchema.Type;

export const LoopConfigSchema = S.Struct({
  task: S.String,
  maxIterations: S.Number,
  verifyCommands: S.Array(S.String),
  sessionId: S.optional(S.String),
  branch: S.optional(S.String),
  push: S.optional(S.Boolean),
  pr: S.optional(S.Boolean),
  verbose: S.optional(S.Boolean),
  prompts: S.optional(PromptConfigSchema),
  /** LLM provider to use. Defaults to "claude". */
  provider: S.optional(ProviderNameSchema),
  /** Skip all permission prompts (YOLO mode). Use with caution. */
  yolo: S.optional(S.Boolean),
  /** Enable debug logging to .ferix/logs/<session>.log */
  debug: S.optional(S.Boolean),
});
export type LoopConfig = typeof LoopConfigSchema.Type;

export const LoopSummarySchema = S.Struct({
  iterations: S.Number,
  success: S.Boolean,
  sessionId: S.String,
  completedTasks: S.Array(S.String),
  durationMs: S.Number,
  branchPushed: S.optional(S.Boolean),
  prUrl: S.optional(S.String),
});
export type LoopSummary = typeof LoopSummarySchema.Type;

export const LoopErrorSchema = S.Struct({
  message: S.String,
  phase: S.String,
  iteration: S.optional(S.Number),
});
