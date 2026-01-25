import { Schema as S } from "effect";

/**
 * Session status schema.
 */
export const SessionStatusSchema = S.Literal(
  "active",
  "completed",
  "failed",
  "paused"
);
export type SessionStatus = typeof SessionStatusSchema.Type;

/**
 * Session schema.
 */
export const SessionSchema = S.Struct({
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
});
export type Session = typeof SessionSchema.Type;

/**
 * Decode helper.
 */
export const decodeSession = S.decodeUnknown(SessionSchema);
