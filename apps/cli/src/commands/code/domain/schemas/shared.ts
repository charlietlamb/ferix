import { Schema as S } from "effect";

/**
 * Basic info schemas for tasks, phases, and criteria.
 */
const TaskBasicInfoSchema = S.Struct({
  id: S.String,
  title: S.String,
  description: S.String,
});
export type TaskBasicInfo = typeof TaskBasicInfoSchema.Type;

const PhaseBasicInfoSchema = S.Struct({
  id: S.String,
  description: S.String,
});
export type PhaseBasicInfo = typeof PhaseBasicInfoSchema.Type;

const CriterionBasicInfoSchema = S.Struct({
  id: S.String,
  description: S.String,
});
export type CriterionBasicInfo = typeof CriterionBasicInfoSchema.Type;

/**
 * Data schemas (base for signals, without _tag).
 */
export const TasksDefinedDataSchema = S.Struct({
  tasks: S.Array(TaskBasicInfoSchema),
});

export const PhasesDefinedDataSchema = S.Struct({
  taskId: S.String,
  phases: S.Array(PhaseBasicInfoSchema),
});

export const CriteriaDefinedDataSchema = S.Struct({
  taskId: S.String,
  criteria: S.Array(CriterionBasicInfoSchema),
});

export const PhaseIdDataSchema = S.Struct({
  phaseId: S.String,
});

export const PhaseFailedDataSchema = S.Struct({
  phaseId: S.String,
  reason: S.String,
});

export const CriterionIdDataSchema = S.Struct({
  criterionId: S.String,
});

export const CriterionFailedDataSchema = S.Struct({
  criterionId: S.String,
  reason: S.String,
});

export const ReviewCompleteDataSchema = S.Struct({
  changesMade: S.Boolean,
});

export const TaskCompleteSignalDataSchema = S.Struct({
  taskId: S.String,
  summary: S.String,
  filesModified: S.Array(S.String),
  filesCreated: S.Array(S.String),
  commitMessage: S.String,
});

/**
 * TaskCompleteData without file arrays (used by events).
 */
export const TaskCompleteDataSchema = S.Struct({
  taskId: S.String,
  summary: S.String,
});
