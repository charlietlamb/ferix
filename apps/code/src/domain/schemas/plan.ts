import { Brand, Schema as S } from "effect";

/**
 * Branded PlanId type.
 */
export type PlanId = string & Brand.Brand<"PlanId">;
export const PlanId = Brand.nominal<PlanId>();

/**
 * Status schemas.
 */
export const TaskStatusSchema = S.Literal(
  "pending",
  "planning",
  "in_progress",
  "done",
  "failed",
  "skipped"
);
export type TaskStatus = typeof TaskStatusSchema.Type;

export const PhaseStatusSchema = S.Literal(
  "pending",
  "in_progress",
  "done",
  "failed"
);
export type PhaseStatus = typeof PhaseStatusSchema.Type;

export const CriterionStatusSchema = S.Literal("pending", "passed", "failed");
export type CriterionStatus = typeof CriterionStatusSchema.Type;

/**
 * Phase schema.
 */
export const PhaseSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: PhaseStatusSchema,
});
export type Phase = typeof PhaseSchema.Type;

/**
 * Criterion schema.
 */
export const CriterionSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: CriterionStatusSchema,
  failureReason: S.optional(S.String),
});
export type Criterion = typeof CriterionSchema.Type;

/**
 * Task schema.
 */
export const TaskSchema = S.Struct({
  id: S.String,
  title: S.String,
  description: S.String,
  status: TaskStatusSchema,
  phases: S.Array(PhaseSchema),
  criteria: S.Array(CriterionSchema),
  filesToModify: S.Array(S.String),
  attempts: S.Number,
  completionNotes: S.optional(S.String),
});
export type Task = typeof TaskSchema.Type;

/**
 * Plan data schema (without id, for deserialization).
 */
export const PlanDataSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.String,
  originalTask: S.String,
  context: S.optional(S.String),
  tasks: S.Array(TaskSchema),
});
export type PlanData = typeof PlanDataSchema.Type;

/**
 * Plan schema with id.
 */
export const PlanSchema = S.Struct({
  id: S.String,
  sessionId: S.String,
  createdAt: S.String,
  originalTask: S.String,
  context: S.optional(S.String),
  tasks: S.Array(TaskSchema),
});
export type Plan = typeof PlanSchema.Type & { readonly id: PlanId };

/**
 * Decode helpers.
 */
export const decodePlan = S.decodeUnknown(PlanSchema);
export const decodePlanData = S.decodeUnknown(PlanDataSchema);
