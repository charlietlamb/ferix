import type { Provider, Session } from "../../domain/index.js";

/**
 * Constants for row layout in the sessions list.
 * Sessions take 3 rows: main row + detail row + spacer.
 * "Create new" takes 2 rows: row + spacer.
 */
const ROWS_PER_SESSION = 3;
const ROWS_PER_CREATE_NEW = 2;

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
  /** The branch ferix was started from - used as PR base branch */
  readonly baseBranch?: string;
  /** URL of the PR created for this session (if any) */
  readonly prUrl?: string;
  /** The LLM/agent provider used for this session */
  readonly provider?: Provider;
  /** Last meaningful output line from the LLM (truncated for display) */
  readonly lastOutput?: string;
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
 * PR creation status for tracking async PR creation.
 */
export interface PrCreationStatus {
  readonly sessionId: string;
  readonly status: "pushing" | "creating" | "success" | "error";
  readonly error?: string;
}

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
  /** PR creation progress (if in progress) */
  readonly prCreation?: PrCreationStatus;
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
 * Note: lastOutput is not included here - it should be enriched separately.
 */
export function sessionToLauncherSession(session: Session): LauncherSession {
  return {
    id: session.id,
    displayName: session.displayName,
    originalTask: session.originalTask,
    status: session.status,
    createdAt: session.createdAt,
    branchName: session.branchName,
    baseBranch: session.baseBranch,
    prUrl: session.prUrl,
    provider: session.provider,
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
 * Calculate row position for an item index.
 * Item 0 = "Create new" (ROWS_PER_CREATE_NEW rows)
 * Items 1+ = sessions (ROWS_PER_SESSION rows each)
 */
function getRowPositionForItem(itemIndex: number): number {
  if (itemIndex === 0) {
    return 0;
  }
  // "Create new" takes ROWS_PER_CREATE_NEW rows, then each session takes ROWS_PER_SESSION
  return ROWS_PER_CREATE_NEW + (itemIndex - 1) * ROWS_PER_SESSION;
}

/**
 * Get total rows needed for all items.
 */
function getTotalRows(sessionCount: number): number {
  if (sessionCount === 0) {
    return ROWS_PER_CREATE_NEW;
  }
  return ROWS_PER_CREATE_NEW + sessionCount * ROWS_PER_SESSION;
}

/**
 * Get the height (in rows) for an item.
 */
function getItemHeight(itemIndex: number): number {
  return itemIndex === 0 ? ROWS_PER_CREATE_NEW : ROWS_PER_SESSION;
}

/**
 * Calculate scroll offset (in rows) to keep selected item visible.
 * Ensures the entire item block is visible when possible.
 */
function calculateScrollOffset(
  selectedIndex: number,
  currentOffset: number,
  viewportHeight: number,
  sessionCount: number
): number {
  const itemRowStart = getRowPositionForItem(selectedIndex);
  const itemHeight = getItemHeight(selectedIndex);
  const itemRowEnd = itemRowStart + itemHeight;
  const totalRows = getTotalRows(sessionCount);
  const visibleRows = viewportHeight;

  // If item starts above visible area, scroll up to show it
  if (itemRowStart < currentOffset) {
    return itemRowStart;
  }

  // If item ends below visible area, scroll down to show it
  if (itemRowEnd > currentOffset + visibleRows) {
    return Math.max(0, itemRowEnd - visibleRows);
  }

  // Item is visible, keep current offset
  // But make sure we don't have unnecessary scroll at the end
  const maxOffset = Math.max(0, totalRows - visibleRows);
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
    state.sessions.length
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
  const totalRows = getTotalRows(state.sessions.length);
  const maxOffset = Math.max(0, totalRows - height);
  const scrollOffset = Math.min(state.scrollOffset, maxOffset);

  return { ...state, viewportHeight: height, scrollOffset };
}

/**
 * Scroll the list by a delta amount (for mouse wheel).
 */
export function scrollList(state: LauncherState, delta: number): LauncherState {
  const totalRows = getTotalRows(state.sessions.length);
  const maxOffset = Math.max(0, totalRows - state.viewportHeight);

  const newOffset = Math.max(
    0,
    Math.min(maxOffset, state.scrollOffset + delta)
  );

  if (newOffset === state.scrollOffset) {
    return state;
  }

  return { ...state, scrollOffset: newOffset };
}
