import type {
  CriteriaDefinedData,
  CriterionFailedData,
  CriterionIdData,
  PhaseFailedData,
  PhaseIdData,
  PhasesDefinedData,
  ReviewCompleteData,
  TaskCompleteSignalData,
  TasksDefinedData,
} from "./shared-types.js";

/**
 * Signal indicating tasks have been defined during breakdown.
 */
export interface TasksDefinedSignal extends TasksDefinedData {
  readonly _tag: "TasksDefined";
}

/**
 * Signal indicating phases have been defined for a task.
 */
export interface PhasesDefinedSignal extends PhasesDefinedData {
  readonly _tag: "PhasesDefined";
}

/**
 * Signal indicating criteria have been defined for a task.
 */
export interface CriteriaDefinedSignal extends CriteriaDefinedData {
  readonly _tag: "CriteriaDefined";
}

/**
 * Signal indicating a phase has started.
 */
export interface PhaseStartedSignal extends PhaseIdData {
  readonly _tag: "PhaseStarted";
}

/**
 * Signal indicating a phase has completed.
 */
export interface PhaseCompletedSignal extends PhaseIdData {
  readonly _tag: "PhaseCompleted";
}

/**
 * Signal indicating a phase has failed.
 */
export interface PhaseFailedSignal extends PhaseFailedData {
  readonly _tag: "PhaseFailed";
}

/**
 * Signal indicating a criterion has passed.
 */
export interface CriterionPassedSignal extends CriterionIdData {
  readonly _tag: "CriterionPassed";
}

/**
 * Signal indicating a criterion has failed.
 */
export interface CriterionFailedSignal extends CriterionFailedData {
  readonly _tag: "CriterionFailed";
}

/**
 * Signal indicating all checks have passed.
 */
export interface CheckPassedSignal {
  readonly _tag: "CheckPassed";
}

/**
 * Signal indicating checks have failed.
 */
export interface CheckFailedSignal {
  readonly _tag: "CheckFailed";
}

/**
 * Signal indicating review is complete.
 */
export interface ReviewCompleteSignal extends ReviewCompleteData {
  readonly _tag: "ReviewComplete";
}

/**
 * Signal indicating the task is complete.
 */
export interface TaskCompleteSignal extends TaskCompleteSignalData {
  readonly _tag: "TaskComplete";
}

/**
 * Signal indicating the entire loop is complete.
 */
export interface LoopCompleteSignal {
  readonly _tag: "LoopComplete";
}

/**
 * Union of all possible signals parsed from LLM output.
 */
export type Signal =
  | TasksDefinedSignal
  | PhasesDefinedSignal
  | CriteriaDefinedSignal
  | PhaseStartedSignal
  | PhaseCompletedSignal
  | PhaseFailedSignal
  | CriterionPassedSignal
  | CriterionFailedSignal
  | CheckPassedSignal
  | CheckFailedSignal
  | ReviewCompleteSignal
  | TaskCompleteSignal
  | LoopCompleteSignal;
