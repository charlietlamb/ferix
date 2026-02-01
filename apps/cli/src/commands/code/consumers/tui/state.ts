import type { TUIState } from "../../domain/schemas/tui.js";

export function createInitialState(): TUIState {
  return {
    task: "",
    iteration: 0,
    maxIterations: 0,
    status: "idle",
    startTime: 0, // Will be set when LoopStarted event is received
    discoveryInProgress: false,
    discoveryCompleted: false,
    executionMode: "idle",
    outputLines: [],
    partialLine: "",
    tasks: [],
    viewMode: "logs",
    selectedTaskIndex: 0,
    scrollOffset: 0,
    userScrolled: false,
    gitPushed: false,
    yolo: false,
    debug: false,
    pr: false,
    provider: "claude",
  };
}

// Re-export reducer from registry-based implementation
export { appendError, reduce } from "./reducers/index.js";

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
