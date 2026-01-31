import { Schema as S } from "effect";
import {
  CriteriaDefinedDataSchema,
  CriterionFailedDataSchema,
  CriterionIdDataSchema,
  PhaseFailedDataSchema,
  PhaseIdDataSchema,
  PhasesDefinedDataSchema,
  ReviewCompleteDataSchema,
  TaskCompleteSignalDataSchema,
  TasksDefinedDataSchema,
} from "./shared.js";

/**
 * Helper to extend data schema with tag.
 */
const taggedFromData = <Tag extends string, Fields extends S.Struct.Fields>(
  tag: Tag,
  dataSchema: S.Struct<Fields>
) => S.TaggedStruct(tag, dataSchema.fields);

/**
 * Signal schemas.
 */
export const TasksDefinedSignalSchema = taggedFromData(
  "TasksDefined",
  TasksDefinedDataSchema
);
export type TasksDefinedSignal = typeof TasksDefinedSignalSchema.Type;

export const PhasesDefinedSignalSchema = taggedFromData(
  "PhasesDefined",
  PhasesDefinedDataSchema
);
export type PhasesDefinedSignal = typeof PhasesDefinedSignalSchema.Type;

export const CriteriaDefinedSignalSchema = taggedFromData(
  "CriteriaDefined",
  CriteriaDefinedDataSchema
);
export type CriteriaDefinedSignal = typeof CriteriaDefinedSignalSchema.Type;

export const PhaseStartedSignalSchema = taggedFromData(
  "PhaseStarted",
  PhaseIdDataSchema
);
export type PhaseStartedSignal = typeof PhaseStartedSignalSchema.Type;

export const PhaseCompletedSignalSchema = taggedFromData(
  "PhaseCompleted",
  PhaseIdDataSchema
);
export type PhaseCompletedSignal = typeof PhaseCompletedSignalSchema.Type;

export const PhaseFailedSignalSchema = taggedFromData(
  "PhaseFailed",
  PhaseFailedDataSchema
);
export type PhaseFailedSignal = typeof PhaseFailedSignalSchema.Type;

export const CriterionPassedSignalSchema = taggedFromData(
  "CriterionPassed",
  CriterionIdDataSchema
);
export type CriterionPassedSignal = typeof CriterionPassedSignalSchema.Type;

export const CriterionFailedSignalSchema = taggedFromData(
  "CriterionFailed",
  CriterionFailedDataSchema
);
export type CriterionFailedSignal = typeof CriterionFailedSignalSchema.Type;

export const CheckPassedSignalSchema = S.TaggedStruct("CheckPassed", {});
export type CheckPassedSignal = typeof CheckPassedSignalSchema.Type;

export const CheckFailedSignalSchema = S.TaggedStruct("CheckFailed", {});
export type CheckFailedSignal = typeof CheckFailedSignalSchema.Type;

export const ReviewCompleteSignalSchema = taggedFromData(
  "ReviewComplete",
  ReviewCompleteDataSchema
);
export type ReviewCompleteSignal = typeof ReviewCompleteSignalSchema.Type;

export const TaskCompleteSignalSchema = taggedFromData(
  "TaskComplete",
  TaskCompleteSignalDataSchema
);
export type TaskCompleteSignal = typeof TaskCompleteSignalSchema.Type;

/**
 * Session name signal - defines a task-based descriptive name for the session.
 * Generated during discovery phase.
 */
export const SessionNameDefinedSignalSchema = S.TaggedStruct(
  "SessionNameDefined",
  {
    /** Kebab-case slug, e.g., "add-dark-mode-toggle" */
    name: S.String,
  }
);
export type SessionNameDefinedSignal =
  typeof SessionNameDefinedSignalSchema.Type;

/**
 * Learning category types.
 */
const LearningCategorySchema = S.Literal("success", "failure", "optimization");
export type LearningCategory = typeof LearningCategorySchema.Type;

/**
 * Learning signal - records insights discovered during iteration.
 */
export const LearningSignalSchema = S.TaggedStruct("Learning", {
  content: S.String,
  category: S.optional(LearningCategorySchema),
});
export type LearningSignal = typeof LearningSignalSchema.Type;

/**
 * Guardrail signal - records failure patterns to avoid.
 */
export const GuardrailSignalSchema = S.TaggedStruct("Guardrail", {
  pattern: S.String,
  sign: S.String,
  avoidance: S.String,
  severity: S.Literal("warning", "critical"),
});
export type GuardrailSignal = typeof GuardrailSignalSchema.Type;

/**
 * Union of all signals.
 */
const SignalSchema = S.Union(
  TasksDefinedSignalSchema,
  PhasesDefinedSignalSchema,
  CriteriaDefinedSignalSchema,
  PhaseStartedSignalSchema,
  PhaseCompletedSignalSchema,
  PhaseFailedSignalSchema,
  CriterionPassedSignalSchema,
  CriterionFailedSignalSchema,
  CheckPassedSignalSchema,
  CheckFailedSignalSchema,
  ReviewCompleteSignalSchema,
  TaskCompleteSignalSchema,
  LearningSignalSchema,
  GuardrailSignalSchema,
  SessionNameDefinedSignalSchema
);
export type Signal = typeof SignalSchema.Type;
