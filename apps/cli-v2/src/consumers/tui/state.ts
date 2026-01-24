// View modes
export type ViewMode = "logs" | "tasks" | "detail";

// Loop status
export type LoopStatus = "idle" | "running" | "complete" | "error";

// Execution mode displayed in status bar
export type ExecutionMode =
  | "idle"
  | "breakdown"
  | "planning"
  | "working"
  | "checking"
  | "verifying"
  | "reviewing";

// Phase status
export type PhaseStatus = "pending" | "in_progress" | "done" | "failed";

// Criterion status
export type CriterionStatus = "pending" | "passed" | "failed";

// Task status
export type TaskStatus = "pending" | "in_progress" | "done" | "failed";

export interface TUIPhase {
  readonly id: string;
  readonly description: string;
  readonly status: PhaseStatus;
  readonly startedAt?: number;
  readonly completedAt?: number;
}

export interface TUICriterion {
  readonly id: string;
  readonly description: string;
  readonly status: CriterionStatus;
  readonly failureReason?: string;
}

export interface TUITask {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly phases: readonly TUIPhase[];
  readonly criteria: readonly TUICriterion[];
  readonly startedAt?: number;
  readonly completedAt?: number;
}

export interface TUIState {
  // Loop info
  readonly task: string;
  readonly iteration: number;
  readonly maxIterations: number;
  readonly status: LoopStatus;
  readonly startTime: number;

  // Current activity
  readonly executionMode: ExecutionMode;
  readonly currentTool?: string;
  readonly currentTaskId?: string;

  // Output
  readonly outputLines: readonly string[];
  readonly partialLine: string;

  // Tasks
  readonly tasks: readonly TUITask[];

  // Navigation
  readonly viewMode: ViewMode;
  readonly selectedTaskIndex: number;
  readonly scrollOffset: number;
  readonly userScrolled: boolean;

  // Git
  readonly gitBranch?: string;
  readonly gitPushed: boolean;
  readonly prUrl?: string;
}

export function createInitialState(): TUIState {
  return {
    task: "",
    iteration: 0,
    maxIterations: 0,
    status: "idle",
    startTime: Date.now(),
    executionMode: "idle",
    outputLines: [],
    partialLine: "",
    tasks: [],
    viewMode: "logs",
    selectedTaskIndex: 0,
    scrollOffset: 0,
    userScrolled: false,
    gitPushed: false,
  };
}

export type { StateReducer, StateReducerRegistry } from "./reducers/index.js";
// Re-export reducer from registry-based implementation
export { appendError, reduce, stateReducerRegistry } from "./reducers/index.js";

// Scroll helpers
export function scroll(
  state: TUIState,
  direction: "up" | "down",
  lines: number,
  maxOffset: number
): TUIState {
  const delta = direction === "up" ? -lines : lines;
  const newOffset = Math.max(
    0,
    Math.min(maxOffset, state.scrollOffset + delta)
  );
  let userScrolled: boolean;
  if (direction === "up") {
    userScrolled = true;
  } else if (newOffset < maxOffset) {
    userScrolled = state.userScrolled;
  } else {
    userScrolled = false;
  }
  return { ...state, scrollOffset: newOffset, userScrolled };
}

export function scrollTo(
  state: TUIState,
  position: "top" | "bottom",
  maxOffset: number
): TUIState {
  const scrollOffset = position === "top" ? 0 : maxOffset;
  const userScrolled = position === "top";
  return { ...state, scrollOffset, userScrolled };
}

export function navigate(
  state: TUIState,
  direction: "next" | "prev" | "first" | "last"
): TUIState {
  const maxIndex = Math.max(0, state.tasks.length - 1);
  let selectedTaskIndex: number;

  switch (direction) {
    case "next":
      selectedTaskIndex = Math.min(maxIndex, state.selectedTaskIndex + 1);
      break;
    case "prev":
      selectedTaskIndex = Math.max(0, state.selectedTaskIndex - 1);
      break;
    case "first":
      selectedTaskIndex = 0;
      break;
    case "last":
      selectedTaskIndex = maxIndex;
      break;
    default:
      selectedTaskIndex = state.selectedTaskIndex;
  }

  return { ...state, selectedTaskIndex };
}
