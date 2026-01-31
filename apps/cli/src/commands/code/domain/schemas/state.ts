import { Schema as S } from "effect";

/**
 * Task summary for quick progress overview.
 */
const TaskSummarySchema = S.Struct({
  total: S.Number,
  done: S.Number,
  inProgress: S.Number,
  pending: S.Number,
});

/**
 * Phase state within a task.
 */
const PhaseStateSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: S.Literal("pending", "in_progress", "done", "failed"),
});

/**
 * Criterion state within a task.
 */
const CriterionStateSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: S.Literal("pending", "passed", "failed"),
});

/**
 * Current task details for STATE.json.
 */
const CurrentTaskSchema = S.Struct({
  id: S.String,
  title: S.String,
  description: S.String,
  phases: S.Array(PhaseStateSchema),
  criteria: S.Array(CriterionStateSchema),
});

/**
 * Session state schema for STATE.json.
 *
 * Contains all session-specific state including:
 * - Original task description
 * - Iteration info
 * - Task progress summary
 * - Current task details
 * - Recent progress entries
 */
const SessionStateSchema = S.Struct({
  sessionId: S.String,
  originalTask: S.String,
  iteration: S.Number,
  maxIterations: S.Number,
  taskSummary: TaskSummarySchema,
  currentTask: S.NullOr(CurrentTaskSchema),
  recentProgress: S.Array(S.String),
});
export type SessionState = typeof SessionStateSchema.Type;

/**
 * Decode helper for session state.
 */
export const decodeSessionState = S.decodeUnknown(SessionStateSchema);
