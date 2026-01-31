import { Brand, Schema as S } from "effect";

/**
 * Branded PlanId type.
 */
export type PlanId = string & Brand.Brand<"PlanId">;
export const PlanId = Brand.nominal<PlanId>();

/**
 * Status schemas.
 */
const TaskStatusSchema = S.Literal(
  "pending",
  "planning",
  "in_progress",
  "done",
  "failed",
  "skipped"
);

const PhaseStatusSchema = S.Literal("pending", "in_progress", "done", "failed");

const CriterionStatusSchema = S.Literal("pending", "passed", "failed");

/**
 * Phase schema.
 */
const PhaseSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: PhaseStatusSchema,
});

/**
 * Criterion schema.
 */
const CriterionSchema = S.Struct({
  id: S.String,
  description: S.String,
  status: CriterionStatusSchema,
  failureReason: S.optional(S.String),
});

/**
 * Task schema.
 */
const TaskSchema = S.Struct({
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
const PlanDataSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.String,
  originalTask: S.String,
  context: S.optional(S.String),
  tasks: S.Array(TaskSchema),
});

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
export const decodePlanData = S.decodeUnknown(PlanDataSchema);
