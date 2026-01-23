/**
 * Status of a session.
 */
export type SessionStatus = "active" | "completed" | "failed" | "paused";

/**
 * A session tracks the state of a ralph loop execution.
 */
export interface Session {
  /**
   * Unique identifier (human-readable, e.g., "brave-purple-dolphin").
   */
  readonly id: string;

  /**
   * ISO timestamp when session was created.
   */
  readonly createdAt: string;

  /**
   * Current status of the session.
   */
  readonly status: SessionStatus;

  /**
   * Original task that started this session.
   */
  readonly originalTask: string;

  /**
   * IDs of completed tasks.
   */
  readonly completedTasks: readonly string[];

  /**
   * ID of the currently active task, if any.
   */
  readonly currentTaskId?: string;
}
