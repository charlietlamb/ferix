/**
 * TUI-related types for forms and dev mode
 */

import type { Task } from "./config.js";

/**
 * State for text input handling
 */
export interface TextInputState {
  inputLines: string[];
  cursorLine: number;
  cursorCol: number;
}

/**
 * Actions that can result from parsing a key press in text input
 */
export type TextKeyAction =
  | { type: "cancel" }
  | { type: "submit" }
  | { type: "newline" }
  | { type: "backspace" }
  | { type: "arrow"; direction: "up" | "down" | "left" | "right" }
  | { type: "char"; char: string }
  | { type: "none" };

/**
 * Task tracking status for dev mode
 */
export type TaskStatus = "analyzing" | "tracking" | "none";

/**
 * View modes available in dev mode TUI
 */
export type ViewMode = "logs" | "tasks" | "task-detail";

/**
 * Execution mode - which phase the planner/worker loop is in
 *
 * - idle: Not started or waiting
 * - breakdown: Initial task analysis and plan creation
 * - planning: Planning phases for a specific task
 * - working: Executing a task's phases
 * - reviewing: Verifying success criteria after work completes
 */
export type ExecutionMode =
  | "idle"
  | "breakdown"
  | "planning"
  | "working"
  | "reviewing";

/**
 * Git information for display in TUI
 */
export interface GitInfo {
  branch?: string;
  baseBranch?: string;
  pushed: boolean;
  prUrl?: string;
}

/**
 * Navigation state for tasks list view
 */
export interface TasksListState {
  selectedIndex: number;
  scrollOffset: number;
}

/**
 * State for the dev mode full-screen TUI
 */
export interface DevModeState {
  task: string;
  iteration: number;
  maxIterations: number | string;
  status: "idle" | "running" | "complete" | "error";
  currentTool?: string;
  outputLines: string[];
  startTime: number;
  /** Task tracking state */
  taskStatus: TaskStatus;
  /** Extracted tasks from the work */
  tasks: Task[];
  /** Current view mode */
  viewMode: ViewMode;
  /** Tasks list navigation state */
  tasksListState: TasksListState;
  /** Git information */
  gitInfo: GitInfo;
  /** Current execution mode (planner/worker phase) */
  executionMode: ExecutionMode;
  /** Current task ID being worked on (for planning/working modes) */
  currentTaskId?: number;
}

/**
 * Scroll information for the output area
 */
export interface ScrollInfo {
  /** Current scroll offset (line number at top of viewport) */
  offset: number;
  /** Number of visible lines in output area */
  outputHeight: number;
  /** Total number of output lines */
  totalLines: number;
  /** Whether user has manually scrolled (disables auto-scroll) */
  userScrolled: boolean;
}
