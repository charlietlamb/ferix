import type { LoopConfig, LoopError, LoopSummary } from "./config.js";
import type { Plan } from "./plan.js";
import type {
  CriteriaDefinedData,
  CriterionFailedData,
  CriterionIdData,
  PhaseFailedData,
  PhaseIdData,
  PhasesDefinedData,
  ReviewCompleteData,
  TaskCompleteData,
  TasksDefinedData,
} from "./shared-types.js";

/**
 * Event emitted when the loop starts.
 */
export interface LoopStartedEvent {
  readonly _tag: "LoopStarted";
  readonly config: LoopConfig;
}

/**
 * Event emitted when the loop completes successfully.
 */
export interface LoopCompletedEvent {
  readonly _tag: "LoopCompleted";
  readonly summary: LoopSummary;
}

/**
 * Event emitted when the loop fails.
 */
export interface LoopFailedEvent {
  readonly _tag: "LoopFailed";
  readonly error: LoopError;
}

/**
 * Event emitted when an iteration starts.
 */
export interface IterationStartedEvent {
  readonly _tag: "IterationStarted";
  readonly iteration: number;
}

/**
 * Event emitted when an iteration completes.
 */
export interface IterationCompletedEvent {
  readonly _tag: "IterationCompleted";
  readonly iteration: number;
}

/**
 * Event emitted when LLM produces text output.
 */
export interface LLMTextEvent {
  readonly _tag: "LLMText";
  readonly text: string;
}

/**
 * Event emitted when LLM starts using a tool.
 */
export interface LLMToolStartEvent {
  readonly _tag: "LLMToolStart";
  readonly tool: string;
}

/**
 * Event emitted when LLM uses a tool with input.
 */
export interface LLMToolUseEvent {
  readonly _tag: "LLMToolUse";
  readonly tool: string;
  readonly input: unknown;
}

/**
 * Event emitted when LLM finishes using a tool.
 */
export interface LLMToolEndEvent {
  readonly _tag: "LLMToolEnd";
  readonly tool: string;
}

/**
 * Event emitted when tasks are defined during breakdown.
 */
export interface TasksDefinedEvent extends TasksDefinedData {
  readonly _tag: "TasksDefined";
}

/**
 * Event emitted when phases are defined for a task.
 */
export interface PhasesDefinedEvent extends PhasesDefinedData {
  readonly _tag: "PhasesDefined";
}

/**
 * Event emitted when criteria are defined for a task.
 */
export interface CriteriaDefinedEvent extends CriteriaDefinedData {
  readonly _tag: "CriteriaDefined";
}

/**
 * Event emitted when a phase starts execution.
 */
export interface PhaseStartedEvent extends PhaseIdData {
  readonly _tag: "PhaseStarted";
}

/**
 * Event emitted when a phase completes successfully.
 */
export interface PhaseCompletedEvent extends PhaseIdData {
  readonly _tag: "PhaseCompleted";
}

/**
 * Event emitted when a phase fails.
 */
export interface PhaseFailedEvent extends PhaseFailedData {
  readonly _tag: "PhaseFailed";
}

/**
 * Event emitted when a criterion passes verification.
 */
export interface CriterionPassedEvent extends CriterionIdData {
  readonly _tag: "CriterionPassed";
}

/**
 * Event emitted when a criterion fails verification.
 */
export interface CriterionFailedEvent extends CriterionFailedData {
  readonly _tag: "CriterionFailed";
}

/**
 * Event emitted when all checks pass.
 */
export interface CheckPassedEvent {
  readonly _tag: "CheckPassed";
}

/**
 * Event emitted when checks fail.
 */
export interface CheckFailedEvent {
  readonly _tag: "CheckFailed";
  readonly failedCriteria: readonly string[];
}

/**
 * Event emitted when code review completes.
 */
export interface ReviewCompleteEvent extends ReviewCompleteData {
  readonly _tag: "ReviewComplete";
}

/**
 * Event emitted when a task completes.
 */
export interface TaskCompletedEvent extends TaskCompleteData {
  readonly _tag: "TaskCompleted";
}

/**
 * Event emitted when a plan is created.
 */
export interface PlanCreatedEvent {
  readonly _tag: "PlanCreated";
  readonly plan: Plan;
}

/**
 * Event emitted when a plan is updated.
 */
export interface PlanUpdatedEvent {
  readonly _tag: "PlanUpdated";
  readonly plan: Plan;
}

/**
 * Event emitted when a plan update fails.
 */
export interface PlanUpdateFailedEvent {
  readonly _tag: "PlanUpdateFailed";
  readonly operation: "create" | "update";
  readonly error: string;
  readonly planId?: string;
}

/**
 * Union of all domain events that flow through the system.
 */
export type DomainEvent =
  | LoopStartedEvent
  | LoopCompletedEvent
  | LoopFailedEvent
  | IterationStartedEvent
  | IterationCompletedEvent
  | LLMTextEvent
  | LLMToolStartEvent
  | LLMToolUseEvent
  | LLMToolEndEvent
  | TasksDefinedEvent
  | PhasesDefinedEvent
  | CriteriaDefinedEvent
  | PhaseStartedEvent
  | PhaseCompletedEvent
  | PhaseFailedEvent
  | CriterionPassedEvent
  | CriterionFailedEvent
  | CheckPassedEvent
  | CheckFailedEvent
  | ReviewCompleteEvent
  | TaskCompletedEvent
  | PlanCreatedEvent
  | PlanUpdatedEvent
  | PlanUpdateFailedEvent;

/**
 * Type guard utilities for domain events.
 */
export const DomainEvent = {
  /**
   * Check if event is an LLM-related event.
   */
  isLLMEvent: (
    e: DomainEvent
  ): e is
    | LLMTextEvent
    | LLMToolStartEvent
    | LLMToolUseEvent
    | LLMToolEndEvent => e._tag.startsWith("LLM"),

  /**
   * Check if event is a phase-related event.
   */
  isPhaseEvent: (
    e: DomainEvent
  ): e is PhaseStartedEvent | PhaseCompletedEvent | PhaseFailedEvent =>
    e._tag.startsWith("Phase"),

  /**
   * Check if event is a criterion-related event.
   */
  isCriterionEvent: (
    e: DomainEvent
  ): e is CriterionPassedEvent | CriterionFailedEvent =>
    e._tag.startsWith("Criterion"),

  /**
   * Check if event is a loop lifecycle event.
   */
  isLoopEvent: (
    e: DomainEvent
  ): e is LoopStartedEvent | LoopCompletedEvent | LoopFailedEvent =>
    e._tag.startsWith("Loop"),
} as const;
