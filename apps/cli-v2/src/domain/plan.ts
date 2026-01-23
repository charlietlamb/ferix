/**
 * Unique identifier for a plan.
 */
export type PlanId = string & { readonly _brand: unique symbol };

/**
 * Creates a PlanId from a string.
 */
export const PlanId = (id: string): PlanId => id as PlanId;

/**
 * Status of a task within a plan.
 */
export type TaskStatus =
  | "pending"
  | "planning"
  | "in_progress"
  | "done"
  | "failed"
  | "skipped";

/**
 * Status of a phase within a task.
 */
export type PhaseStatus = "pending" | "in_progress" | "done" | "failed";

/**
 * Status of a success criterion.
 */
export type CriterionStatus = "pending" | "passed" | "failed";

/**
 * A phase within a task - a smaller unit of work.
 */
export interface Phase {
  /**
   * Unique identifier (e.g., "1.1", "1.2").
   */
  readonly id: string;

  /**
   * Brief description of the phase.
   */
  readonly description: string;

  /**
   * Current status of the phase.
   */
  readonly status: PhaseStatus;
}

/**
 * A success criterion for verifying task completion.
 */
export interface Criterion {
  /**
   * Unique identifier (e.g., "1.c1").
   */
  readonly id: string;

  /**
   * Human-readable description.
   */
  readonly description: string;

  /**
   * Verification status.
   */
  readonly status: CriterionStatus;

  /**
   * Reason for failure (only when status is "failed").
   */
  readonly failureReason?: string;
}

/**
 * A task within a plan.
 */
export interface Task {
  /**
   * Unique identifier (numeric string, e.g., "1", "2").
   */
  readonly id: string;

  /**
   * Title of the task.
   */
  readonly title: string;

  /**
   * Detailed description.
   */
  readonly description: string;

  /**
   * Current status.
   */
  readonly status: TaskStatus;

  /**
   * Phases within this task.
   */
  readonly phases: readonly Phase[];

  /**
   * Success criteria for this task.
   */
  readonly criteria: readonly Criterion[];

  /**
   * Files that will be modified.
   */
  readonly filesToModify: readonly string[];

  /**
   * Number of execution attempts.
   */
  readonly attempts: number;

  /**
   * Completion notes after task is done.
   */
  readonly completionNotes?: string;
}

/**
 * A plan containing tasks to execute.
 */
export interface Plan {
  /**
   * Unique identifier for this plan.
   */
  readonly id: PlanId;

  /**
   * Session this plan belongs to.
   */
  readonly sessionId: string;

  /**
   * ISO timestamp when plan was created.
   */
  readonly createdAt: string;

  /**
   * Original task description from user.
   */
  readonly originalTask: string;

  /**
   * Codebase context gathered during breakdown.
   */
  readonly context?: string;

  /**
   * Tasks within this plan.
   */
  readonly tasks: readonly Task[];
}
