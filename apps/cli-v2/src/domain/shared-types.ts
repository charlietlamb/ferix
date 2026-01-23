import type { Criterion, Phase, Task } from "./plan.js";

/**
 * Shared base types for signals and events.
 * These types define the common structure between what the LLM signals
 * and what the domain events look like, reducing duplication.
 */

/**
 * Base data for tasks being defined.
 */
export interface TasksDefinedData {
  readonly tasks: readonly Pick<Task, "id" | "title" | "description">[];
}

/**
 * Base data for phases being defined for a task.
 */
export interface PhasesDefinedData {
  readonly taskId: string;
  readonly phases: readonly Pick<Phase, "id" | "description">[];
}

/**
 * Base data for criteria being defined for a task.
 */
export interface CriteriaDefinedData {
  readonly taskId: string;
  readonly criteria: readonly Pick<Criterion, "id" | "description">[];
}

/**
 * Base data for phase lifecycle events.
 */
export interface PhaseIdData {
  readonly phaseId: string;
}

/**
 * Base data for phase failure.
 */
export interface PhaseFailedData extends PhaseIdData {
  readonly reason: string;
}

/**
 * Base data for criterion identification.
 */
export interface CriterionIdData {
  readonly criterionId: string;
}

/**
 * Base data for criterion failure.
 */
export interface CriterionFailedData extends CriterionIdData {
  readonly reason: string;
}

/**
 * Base data for review completion.
 */
export interface ReviewCompleteData {
  readonly changesMade: boolean;
}

/**
 * Base data for task completion.
 */
export interface TaskCompleteData {
  readonly taskId: string;
  readonly summary: string;
}

/**
 * Base data for task completion with file info (signal-specific).
 */
export interface TaskCompleteSignalData extends TaskCompleteData {
  readonly filesModified: readonly string[];
  readonly filesCreated: readonly string[];
}
