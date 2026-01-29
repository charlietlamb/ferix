import { Schema as S } from "effect";

/**
 * Action types for progress entries.
 */
const ProgressActionSchema = S.Literal(
  "started",
  "completed",
  "failed",
  "learning"
);

/**
 * A single progress entry for the append-only log.
 *
 * Each entry records what happened in an iteration, including:
 * - Which task was worked on
 * - What action was taken
 * - A summary of the work
 * - Any learnings discovered
 * - Files that were modified
 */
const ProgressEntrySchema = S.Struct({
  iteration: S.Number,
  timestamp: S.String,
  taskId: S.String,
  action: ProgressActionSchema,
  summary: S.String,
  learnings: S.optional(S.Array(S.String)),
  filesModified: S.optional(S.Array(S.String)),
});
export type ProgressEntry = typeof ProgressEntrySchema.Type;

/**
 * The complete progress file structure.
 *
 * Contains session metadata and an array of progress entries.
 * This is the structure persisted to `.ferix/plans/:sessionId/progress.md`.
 */
const ProgressFileSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.String,
  entries: S.Array(ProgressEntrySchema),
});
export type ProgressFile = typeof ProgressFileSchema.Type;

/**
 * Decode helpers.
 */
export const decodeProgressFile = S.decodeUnknown(ProgressFileSchema);
