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
