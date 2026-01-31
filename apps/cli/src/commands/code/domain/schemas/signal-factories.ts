/**
 * Factory functions for creating signals with proper typing.
 *
 * These factories provide type-safe signal construction by adding
 * the _tag field automatically. Returns Effect Either for validation.
 */
import { type Either, type ParseResult, Schema as S } from "effect";
import type {
  CriterionBasicInfo,
  PhaseBasicInfo,
  TaskBasicInfo,
} from "./shared.js";
import {
  type CheckFailedSignal,
  CheckFailedSignalSchema,
  type CheckPassedSignal,
  CheckPassedSignalSchema,
  type CriteriaDefinedSignal,
  CriteriaDefinedSignalSchema,
  type CriterionFailedSignal,
  CriterionFailedSignalSchema,
  type CriterionPassedSignal,
  CriterionPassedSignalSchema,
  type GuardrailSignal,
  GuardrailSignalSchema,
  type LearningCategory,
  type LearningSignal,
  LearningSignalSchema,
  type PhaseCompletedSignal,
  PhaseCompletedSignalSchema,
  type PhaseFailedSignal,
  PhaseFailedSignalSchema,
  type PhaseStartedSignal,
  PhaseStartedSignalSchema,
  type PhasesDefinedSignal,
  PhasesDefinedSignalSchema,
  type SessionNameDefinedSignal,
  SessionNameDefinedSignalSchema,
  type TasksDefinedSignal,
  TasksDefinedSignalSchema,
} from "./signals.js";

// Note: ReviewCompleteSignalSchema and TaskCompleteSignalSchema
// are not currently used but the factory functions for them were removed as unused.

/**
 * Create a TasksDefined signal.
 */
export function createTasksDefinedSignal(input: {
  tasks: readonly TaskBasicInfo[];
}): Either.Either<TasksDefinedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(TasksDefinedSignalSchema)({
    _tag: "TasksDefined",
    tasks: input.tasks,
  });
}

/**
 * Create a PhasesDefinedSignal.
 */
export function createPhasesDefinedSignal(input: {
  taskId: string;
  phases: readonly PhaseBasicInfo[];
}): Either.Either<PhasesDefinedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(PhasesDefinedSignalSchema)({
    _tag: "PhasesDefined",
    taskId: input.taskId,
    phases: input.phases,
  });
}

/**
 * Create a CriteriaDefinedSignal.
 */
export function createCriteriaDefinedSignal(input: {
  taskId: string;
  criteria: readonly CriterionBasicInfo[];
}): Either.Either<CriteriaDefinedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(CriteriaDefinedSignalSchema)({
    _tag: "CriteriaDefined",
    taskId: input.taskId,
    criteria: input.criteria,
  });
}

/**
 * Create a PhaseStartedSignal.
 */
export function createPhaseStartedSignal(input: {
  phaseId: string;
}): Either.Either<PhaseStartedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(PhaseStartedSignalSchema)({
    _tag: "PhaseStarted",
    phaseId: input.phaseId,
  });
}

/**
 * Create a PhaseCompletedSignal.
 */
export function createPhaseCompletedSignal(input: {
  phaseId: string;
}): Either.Either<PhaseCompletedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(PhaseCompletedSignalSchema)({
    _tag: "PhaseCompleted",
    phaseId: input.phaseId,
  });
}

/**
 * Create a PhaseFailedSignal.
 */
export function createPhaseFailedSignal(input: {
  phaseId: string;
  reason: string;
}): Either.Either<PhaseFailedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(PhaseFailedSignalSchema)({
    _tag: "PhaseFailed",
    phaseId: input.phaseId,
    reason: input.reason,
  });
}

/**
 * Create a CriterionPassedSignal.
 */
export function createCriterionPassedSignal(input: {
  criterionId: string;
}): Either.Either<CriterionPassedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(CriterionPassedSignalSchema)({
    _tag: "CriterionPassed",
    criterionId: input.criterionId,
  });
}

/**
 * Create a CriterionFailedSignal.
 */
export function createCriterionFailedSignal(input: {
  criterionId: string;
  reason: string;
}): Either.Either<CriterionFailedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(CriterionFailedSignalSchema)({
    _tag: "CriterionFailed",
    criterionId: input.criterionId,
    reason: input.reason,
  });
}

/**
 * Create a CheckPassedSignal.
 */
export function createCheckPassedSignal(
  _input: Record<string, never>
): Either.Either<CheckPassedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(CheckPassedSignalSchema)({
    _tag: "CheckPassed",
  });
}

/**
 * Create a CheckFailedSignal.
 */
export function createCheckFailedSignal(
  _input: Record<string, never>
): Either.Either<CheckFailedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(CheckFailedSignalSchema)({
    _tag: "CheckFailed",
  });
}

/**
 * Create a LearningSignal.
 */
export function createLearningSignal(input: {
  content: string;
  category?: LearningCategory;
}): Either.Either<LearningSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(LearningSignalSchema)({
    _tag: "Learning",
    content: input.content,
    category: input.category,
  });
}

/**
 * Create a GuardrailSignal.
 */
export function createGuardrailSignal(input: {
  pattern: string;
  sign: string;
  avoidance: string;
  severity: "warning" | "critical";
}): Either.Either<GuardrailSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(GuardrailSignalSchema)({
    _tag: "Guardrail",
    pattern: input.pattern,
    sign: input.sign,
    avoidance: input.avoidance,
    severity: input.severity,
  });
}

/**
 * Create a SessionNameDefinedSignal.
 */
export function createSessionNameDefinedSignal(input: {
  name: string;
}): Either.Either<SessionNameDefinedSignal, ParseResult.ParseError> {
  return S.decodeUnknownEither(SessionNameDefinedSignalSchema)({
    _tag: "SessionNameDefined",
    name: input.name,
  });
}
