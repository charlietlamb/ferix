import { Schema as S } from "effect";

/**
 * Basic info schemas for tasks, phases, and criteria.
 */
export const TaskBasicInfoSchema = S.Struct({
  id: S.String,
  title: S.String,
  description: S.String,
});
export type TaskBasicInfo = typeof TaskBasicInfoSchema.Type;

export const PhaseBasicInfoSchema = S.Struct({
  id: S.String,
  description: S.String,
});
export type PhaseBasicInfo = typeof PhaseBasicInfoSchema.Type;

export const CriterionBasicInfoSchema = S.Struct({
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
export type TasksDefinedData = typeof TasksDefinedDataSchema.Type;

export const PhasesDefinedDataSchema = S.Struct({
  taskId: S.String,
  phases: S.Array(PhaseBasicInfoSchema),
});
export type PhasesDefinedData = typeof PhasesDefinedDataSchema.Type;

export const CriteriaDefinedDataSchema = S.Struct({
  taskId: S.String,
  criteria: S.Array(CriterionBasicInfoSchema),
});
export type CriteriaDefinedData = typeof CriteriaDefinedDataSchema.Type;

export const PhaseIdDataSchema = S.Struct({
  phaseId: S.String,
});
export type PhaseIdData = typeof PhaseIdDataSchema.Type;

export const PhaseFailedDataSchema = S.Struct({
  phaseId: S.String,
  reason: S.String,
});
export type PhaseFailedData = typeof PhaseFailedDataSchema.Type;

export const CriterionIdDataSchema = S.Struct({
  criterionId: S.String,
});
export type CriterionIdData = typeof CriterionIdDataSchema.Type;

export const CriterionFailedDataSchema = S.Struct({
  criterionId: S.String,
  reason: S.String,
});
export type CriterionFailedData = typeof CriterionFailedDataSchema.Type;

export const ReviewCompleteDataSchema = S.Struct({
  changesMade: S.Boolean,
});
export type ReviewCompleteData = typeof ReviewCompleteDataSchema.Type;

export const TaskCompleteSignalDataSchema = S.Struct({
  taskId: S.String,
  summary: S.String,
  filesModified: S.Array(S.String),
  filesCreated: S.Array(S.String),
});
export type TaskCompleteSignalData = typeof TaskCompleteSignalDataSchema.Type;

/**
 * TaskCompleteData without file arrays (used by events).
 */
export const TaskCompleteDataSchema = S.Struct({
  taskId: S.String,
  summary: S.String,
});
export type TaskCompleteData = typeof TaskCompleteDataSchema.Type;
