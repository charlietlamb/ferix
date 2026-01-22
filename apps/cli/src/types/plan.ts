/**
 * Plan types for the Planner/Worker architecture
 *
 * The planner/worker architecture uses a persistent plan file (.ferix/PLAN.md)
 * to maintain context across multiple LLM calls. Each task goes through:
 * 1. Planning phase - breaks task into phases
 * 2. Working phase - executes the phases
 */

/**
 * A phase within a task - the smallest trackable unit of work
 *
 * @example
 * { id: "1.1", description: "Create config types", completed: true }
 */
export interface PlanPhase {
  /** Phase ID in format "taskId.phaseNum" (e.g., "1.1", "1.2") */
  id: string;
  /** Brief description of the phase */
  description: string;
  /** Whether the phase is completed */
  completed: boolean;
}

/**
 * Status of a success criterion
 */
export type CriterionStatus = "pending" | "passed" | "failed";

/**
 * A success criterion for verifying task completion
 *
 * Criteria are extracted during breakdown and verified by the reviewer.
 * ALL criteria must pass for a task to be marked as done.
 *
 * @example
 * { id: "1.c1", description: "Config loads from CWD", status: "passed" }
 */
export interface SuccessCriterion {
  /** Criterion ID in format "taskId.cN" (e.g., "1.c1", "1.c2") */
  id: string;
  /** Human-readable criterion description */
  description: string;
  /** Current verification status */
  status: CriterionStatus;
  /** Reason for failure (only set when status is "failed") */
  failureReason?: string;
}

/**
 * Task status values representing the lifecycle of a task
 *
 * - pending: Task not yet started
 * - planning: Planner is creating phases for this task
 * - in_progress: Worker is executing this task
 * - done: Task completed successfully
 * - failed: Task encountered an unrecoverable error
 * - skipped: Task was manually skipped or cancelled
 */
export type TaskStatus =
  | "pending"
  | "planning"
  | "in_progress"
  | "done"
  | "failed"
  | "skipped";

/**
 * A task in the plan - a discrete unit of work
 *
 * Tasks are created during the breakdown phase and executed
 * sequentially by the planner/worker cycle.
 */
export interface PlanTask {
  /** Task ID (sequential, starting at 1) */
  id: number;
  /** Brief title of the task (max ~60 chars) */
  title: string;
  /** Current status */
  status: TaskStatus;
  /** Detailed description of what the task involves */
  description: string;
  /** Phases for this task (added by planner) */
  phases?: PlanPhase[];
  /** Files to modify (added by planner) */
  filesToModify?: string[];
  /** Success criteria for this task (extracted during breakdown) */
  criteria?: SuccessCriterion[];
  /** Number of execution attempts (max 5) */
  attempts?: number;
  /** Completion notes (added by worker on success) */
  completionNotes?: string;
  /** Error message (added by worker on failure) */
  errorMessage?: string;
  /** Number of verify retry attempts (max 3) */
  verifyAttempts?: number;
  /** Error context from failed verification (command, exit code, output) */
  verifyError?: VerifyError;
}

/**
 * Error context from a failed verification command
 *
 * This information is passed to the worker on retry to help fix the issue.
 */
export interface VerifyError {
  /** The command that failed */
  command: string;
  /** Exit code from the command */
  exitCode: number;
  /** Output from the command (stdout + stderr, truncated if needed) */
  output: string;
}

/**
 * The complete plan - persisted to .ferix/PLAN.md
 *
 * The plan serves as the source of truth for task state and
 * provides context to fresh LLM calls.
 */
export interface Plan {
  /** When the plan was created (ISO 8601 string) */
  createdAt: string;
  /** The original user task/request */
  originalTask: string;
  /** Codebase context summary (added by breakdown) */
  context?: string;
  /** List of tasks to complete */
  tasks: PlanTask[];
}

/**
 * Result of a worker execution phase
 */
export interface WorkerResult {
  /** Whether the task was completed successfully */
  success: boolean;
  /** Whether the task failed with an error */
  failed: boolean;
  /** Error message if failed */
  error?: string;
}
