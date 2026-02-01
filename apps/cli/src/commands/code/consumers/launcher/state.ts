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
 * Daemon status information.
 */
export interface DaemonInfo {
  readonly running: boolean;
  readonly pid: number | null;
  readonly activeSessions: number;
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
  /** Scroll offset for the sessions list viewport */
  readonly scrollOffset: number;
  /** Current view mode */
  readonly viewMode: LauncherViewMode;
  /** Task input for new session mode */
  readonly taskInput: string;
  /** Error message to display */
  readonly error?: string;
  /** Whether sessions are loading */
  readonly isLoading: boolean;
  /** Daemon status information */
  readonly daemon: DaemonInfo;
  /** Terminal height for viewport calculations */
  readonly viewportHeight: number;
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
 * Create initial daemon info (stopped state).
 */
function createInitialDaemonInfo(): DaemonInfo {
  return {
    running: false,
    pid: null,
    activeSessions: 0,
  };
}

/**
 * Create initial launcher state.
 */
export function createInitialLauncherState(): LauncherState {
  return {
    sessions: [],
    selectedIndex: 0,
    scrollOffset: 0,
    viewMode: "sessions",
    taskInput: "",
    isLoading: true,
    daemon: createInitialDaemonInfo(),
    viewportHeight: 20, // Default, will be updated on render
  };
}

/**
 * Calculate scroll offset to keep selected index visible.
 * Accounts for 1 line of padding at top (empty line before "Create new").
 */
function calculateScrollOffset(
  selectedIndex: number,
  currentOffset: number,
  viewportHeight: number,
  totalItems: number
): number {
  // Available lines for items (subtract 1 for top padding line)
  const visibleLines = viewportHeight - 1;

  // If selection is above visible area, scroll up
  if (selectedIndex < currentOffset) {
    return selectedIndex;
  }

  // If selection is below visible area, scroll down
  if (selectedIndex >= currentOffset + visibleLines) {
    return Math.max(0, selectedIndex - visibleLines + 1);
  }

  // Selection is visible, keep current offset
  // But make sure we don't have unnecessary scroll at the end
  const maxOffset = Math.max(0, totalItems - visibleLines);
  return Math.min(currentOffset, maxOffset);
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
  const totalItems = maxIndex + 1; // Including "Create new"
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

  // Calculate new scroll offset to keep selection visible
  const scrollOffset = calculateScrollOffset(
    selectedIndex,
    state.scrollOffset,
    state.viewportHeight,
    totalItems
  );

  return { ...state, selectedIndex, scrollOffset };
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

/**
 * Update viewport height (called on render/resize).
 */
export function updateViewportHeight(
  state: LauncherState,
  height: number
): LauncherState {
  if (state.viewportHeight === height) {
    return state;
  }

  // Recalculate scroll offset with new viewport height
  const totalItems = state.sessions.length + 1;
  const visibleLines = height - 1;
  const maxOffset = Math.max(0, totalItems - visibleLines);
  const scrollOffset = Math.min(state.scrollOffset, maxOffset);

  return { ...state, viewportHeight: height, scrollOffset };
}

/**
 * Scroll the list by a delta amount (for mouse wheel).
 */
export function scrollList(state: LauncherState, delta: number): LauncherState {
  const totalItems = state.sessions.length + 1;
  const visibleLines = state.viewportHeight - 1;
  const maxOffset = Math.max(0, totalItems - visibleLines);

  const newOffset = Math.max(
    0,
    Math.min(maxOffset, state.scrollOffset + delta)
  );

  if (newOffset === state.scrollOffset) {
    return state;
  }

  return { ...state, scrollOffset: newOffset };
}
