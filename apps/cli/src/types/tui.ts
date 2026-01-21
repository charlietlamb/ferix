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
}
