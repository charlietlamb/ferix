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
 * This is the structure persisted to `.ferix/plans/:sessionId/progress.json`.
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

/**
 * Format progress entries to human-readable markdown.
 * This is an append-only chronological log for debugging and human review.
 */
export function formatProgressMd(
  progress: ProgressFile,
  originalTask?: string
): string {
  const lines: string[] = [];

  lines.push("# Session Progress Log");
  lines.push("");
  lines.push(`## Session: ${progress.sessionId}`);
  lines.push(`Started: ${progress.createdAt}`);
  if (originalTask) {
    lines.push(`Task: ${originalTask}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const entry of progress.entries) {
    lines.push(`### Iteration ${entry.iteration} - ${entry.timestamp}`);
    lines.push(`**Task**: ${entry.taskId}`);
    lines.push(`**Status**: ${capitalizeFirst(entry.action)}`);
    lines.push(`**Summary**: ${entry.summary}`);

    if (entry.filesModified && entry.filesModified.length > 0) {
      lines.push(`**Files Modified**: ${entry.filesModified.join(", ")}`);
    }

    if (entry.learnings && entry.learnings.length > 0) {
      lines.push("**Learnings**:");
      for (const learning of entry.learnings) {
        lines.push(`- ${learning}`);
      }
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Capitalize the first letter of a string.
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
