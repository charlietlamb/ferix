import { Schema as S } from "effect";

/**
 * Session status schema.
 */
const SessionStatusSchema = S.Literal(
  "active",
  "completed",
  "failed",
  "paused"
);

/**
 * Provider schema - the LLM/agent provider used for this session.
 */
const ProviderSchema = S.Literal("claude", "cursor", "opencode");
export type Provider = typeof ProviderSchema.Type;

/**
 * Session schema.
 */
const SessionSchema = S.Struct({
  id: S.String,
  createdAt: S.String,
  status: SessionStatusSchema,
  originalTask: S.String,
  completedTasks: S.Array(S.String),
  currentTaskId: S.optional(S.String),
  worktreePath: S.optional(S.String),
  branchName: S.optional(S.String),
  /** Task-based descriptive name (kebab-case slug, e.g., "add-dark-mode-toggle") */
  displayName: S.optional(S.String),
  /** The branch ferix was started from - used as PR base branch */
  baseBranch: S.optional(S.String),
  /** URL of the PR created for this session (if any) */
  prUrl: S.optional(S.String),
  /** The LLM/agent provider used for this session */
  provider: S.optional(ProviderSchema),
});
export type Session = typeof SessionSchema.Type;

/**
 * Decode helper.
 */
export const decodeSession = S.decodeUnknown(SessionSchema);
