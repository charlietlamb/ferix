/**
 * State management for dev mode TUI
 */

import type { DevModeState } from "../../types/tui.js";

// Spinner state (shared across renders)
export const spinnerState = { index: 0 };

/**
 * Create initial dev mode state
 */
export function createDevModeState(
  task: string,
  maxIterations: number | string
): DevModeState {
  return {
    task,
    iteration: 0,
    maxIterations,
    status: "idle",
    outputLines: [],
    startTime: Date.now(),
    taskStatus: "analyzing",
    tasks: [],
  };
}

/**
 * Get task progress from state
 */
export function getTaskProgress(state: DevModeState): {
  completed: number;
  total: number;
} {
  const completed = state.tasks.filter((t) => t.done).length;
  return { completed, total: state.tasks.length };
}

/**
 * Format elapsed time as MM:SS
 */
export function formatElapsed(startTime: number): string {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
