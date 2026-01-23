import { Schema } from "effect";
import type {
  Criterion,
  CriterionStatus,
  Phase,
  PhaseStatus,
  Task,
  TaskStatus,
} from "./plan.js";
import type { Session, SessionStatus } from "./session.js";

/**
 * Schema definitions for runtime validation of domain types.
 * These schemas validate data loaded from storage or external sources.
 */

/**
 * Schema for PhaseStatus.
 */
export const PhaseStatusSchema = Schema.Literal(
  "pending",
  "in_progress",
  "done",
  "failed"
) satisfies Schema.Schema<PhaseStatus>;

/**
 * Schema for CriterionStatus.
 */
export const CriterionStatusSchema = Schema.Literal(
  "pending",
  "passed",
  "failed"
) satisfies Schema.Schema<CriterionStatus>;

/**
 * Schema for TaskStatus.
 */
export const TaskStatusSchema = Schema.Literal(
  "pending",
  "planning",
  "in_progress",
  "done",
  "failed",
  "skipped"
) satisfies Schema.Schema<TaskStatus>;

/**
 * Schema for Phase.
 */
export const PhaseSchema = Schema.Struct({
  id: Schema.String,
  description: Schema.String,
  status: PhaseStatusSchema,
}) satisfies Schema.Schema<Phase>;

/**
 * Schema for Criterion.
 */
export const CriterionSchema = Schema.Struct({
  id: Schema.String,
  description: Schema.String,
  status: CriterionStatusSchema,
  failureReason: Schema.optional(Schema.String),
}) satisfies Schema.Schema<Criterion>;

/**
 * Schema for Task.
 */
export const TaskSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: TaskStatusSchema,
  phases: Schema.Array(PhaseSchema),
  criteria: Schema.Array(CriterionSchema),
  filesToModify: Schema.Array(Schema.String),
  attempts: Schema.Number,
  completionNotes: Schema.optional(Schema.String),
}) satisfies Schema.Schema<Task>;

/**
 * Schema for Plan (without id, for deserialization where id is added separately).
 */
export const PlanDataSchema = Schema.Struct({
  sessionId: Schema.String,
  createdAt: Schema.String,
  originalTask: Schema.String,
  context: Schema.optional(Schema.String),
  tasks: Schema.Array(TaskSchema),
});

/**
 * Schema for Plan with id.
 * Note: PlanId is a branded type, but at runtime it's just a string.
 */
export const PlanSchema = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  createdAt: Schema.String,
  originalTask: Schema.String,
  context: Schema.optional(Schema.String),
  tasks: Schema.Array(TaskSchema),
});

/**
 * Schema for SessionStatus.
 */
export const SessionStatusSchema = Schema.Literal(
  "active",
  "completed",
  "failed",
  "paused"
) satisfies Schema.Schema<SessionStatus>;

/**
 * Schema for Session.
 */
export const SessionSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.String,
  status: SessionStatusSchema,
  originalTask: Schema.String,
  completedTasks: Schema.Array(Schema.String),
  currentTaskId: Schema.optional(Schema.String),
}) satisfies Schema.Schema<Session>;

/**
 * Decode helpers with proper error handling.
 */
export const decodePlan = Schema.decodeUnknown(PlanSchema);
export const decodePlanData = Schema.decodeUnknown(PlanDataSchema);
export const decodeSession = Schema.decodeUnknown(SessionSchema);
