import type { Session } from "../../domain/index.js";

/**
 * Session data for display in the launcher.
 */
export interface LauncherSession {
  readonly id: string;
  readonly displayName?: string;
  readonly originalTask: string;
  readonly status: "active" | "completed" | "failed" | "paused";
  readonly createdAt: string;
  readonly branchName?: string;
}

/**
 * View mode for the launcher TUI.
 */
export type LauncherViewMode = "sessions" | "new_task_input";

/**
 * State for the launcher TUI.
 */
export interface LauncherState {
  /** All sessions to display */
  readonly sessions: readonly LauncherSession[];
  /** Selected index: 0 = "Create new", 1+ = sessions */
  readonly selectedIndex: number;
  /** Current view mode */
  readonly viewMode: LauncherViewMode;
  /** Task input for new session mode */
  readonly taskInput: string;
  /** Error message to display */
  readonly error?: string;
  /** Whether sessions are loading */
  readonly isLoading: boolean;
}

/**
 * Result from the launcher.
 */
export type LauncherResult =
  | {
      readonly type: "select";
      readonly sessionId: string;
      readonly selectedIndex: number;
    }
  | { readonly type: "new"; readonly task: string }
  | { readonly type: "quit" };

/**
 * Convert a Session to a LauncherSession for display.
 */
export function sessionToLauncherSession(session: Session): LauncherSession {
  return {
    id: session.id,
    displayName: session.displayName,
    originalTask: session.originalTask,
    status: session.status,
    createdAt: session.createdAt,
    branchName: session.branchName,
  };
}

/**
 * Create initial launcher state.
 */
export function createInitialLauncherState(): LauncherState {
  return {
    sessions: [],
    selectedIndex: 0,
    viewMode: "sessions",
    taskInput: "",
    isLoading: true,
  };
}

/**
 * Navigate in the session list.
 */
export function navigate(
  state: LauncherState,
  direction: "next" | "prev" | "first" | "last"
): LauncherState {
  // +1 because index 0 is "Create new"
  const maxIndex = state.sessions.length;
  let selectedIndex: number;

  switch (direction) {
    case "next":
      selectedIndex = Math.min(maxIndex, state.selectedIndex + 1);
      break;
    case "prev":
      selectedIndex = Math.max(0, state.selectedIndex - 1);
      break;
    case "first":
      selectedIndex = 0;
      break;
    case "last":
      selectedIndex = maxIndex;
      break;
    default:
      selectedIndex = state.selectedIndex;
  }

  return { ...state, selectedIndex };
}

/**
 * Handle text input for new task.
 */
export function appendTaskInput(
  state: LauncherState,
  char: string
): LauncherState {
  return { ...state, taskInput: state.taskInput + char };
}

/**
 * Delete last character from task input.
 */
export function deleteTaskInputChar(state: LauncherState): LauncherState {
  return { ...state, taskInput: state.taskInput.slice(0, -1) };
}

/**
 * Switch to new task input mode.
 */
export function enterNewTaskMode(state: LauncherState): LauncherState {
  return { ...state, viewMode: "new_task_input", taskInput: "" };
}

/**
 * Switch back to sessions view.
 */
export function exitNewTaskMode(state: LauncherState): LauncherState {
  return { ...state, viewMode: "sessions", taskInput: "" };
}
