import type {
  LauncherResult,
  LauncherState,
  LauncherViewMode,
} from "./state.js";
import {
  appendTaskInput,
  deleteTaskInputChar,
  enterNewTaskMode,
  exitNewTaskMode,
  navigate,
} from "./state.js";

/**
 * Key action types for the launcher.
 */
export type LauncherKeyAction =
  | {
      readonly type: "navigate";
      readonly direction: "next" | "prev" | "first" | "last";
    }
  | { readonly type: "select" }
  | { readonly type: "back" }
  | { readonly type: "quit" }
  | { readonly type: "input"; readonly char: string }
  | { readonly type: "backspace" }
  | { readonly type: "submit" }
  | { readonly type: "none" };

/**
 * Result of applying an action to the launcher state.
 */
export type ApplyActionResult =
  | { readonly type: "state"; readonly state: LauncherState }
  | { readonly type: "result"; readonly result: LauncherResult };

/**
 * Parse a key input into an action based on view mode.
 */
export function parseKey(
  data: Buffer,
  viewMode: LauncherViewMode
): LauncherKeyAction {
  const key = data.toString();

  // Ctrl+C always quits
  if (key === "\x03") {
    return { type: "quit" };
  }

  if (viewMode === "sessions") {
    return parseSessionsKey(key);
  }
  return parseInputKey(key, data);
}

/**
 * Parse key for sessions view.
 */
function parseSessionsKey(key: string): LauncherKeyAction {
  switch (key) {
    // Navigation
    case "j":
    case "\x1b[B": // Down arrow
      return { type: "navigate", direction: "next" };
    case "k":
    case "\x1b[A": // Up arrow
      return { type: "navigate", direction: "prev" };
    case "g":
      return { type: "navigate", direction: "first" };
    case "G":
      return { type: "navigate", direction: "last" };
    // Selection
    case "\r": // Enter
    case "\n":
      return { type: "select" };
    default:
      return { type: "none" };
  }
}

/**
 * Parse key for new task input view.
 */
function parseInputKey(key: string, data: Buffer): LauncherKeyAction {
  // Escape - go back
  if (key === "\x1b" && data.length === 1) {
    return { type: "back" };
  }

  // Enter - submit
  if (key === "\r" || key === "\n") {
    return { type: "submit" };
  }

  // Backspace
  if (key === "\x7f" || key === "\b") {
    return { type: "backspace" };
  }

  // Printable characters
  if (key.length === 1 && key >= " " && key <= "~") {
    return { type: "input", char: key };
  }

  return { type: "none" };
}

/**
 * Apply an action to the launcher state.
 * Returns either a new state or a final result.
 */
export function applyAction(
  state: LauncherState,
  action: LauncherKeyAction
): ApplyActionResult {
  switch (action.type) {
    case "quit":
      return { type: "result", result: { type: "quit" } };

    case "navigate":
      if (state.viewMode === "sessions") {
        return { type: "state", state: navigate(state, action.direction) };
      }
      return { type: "state", state };

    case "select":
      if (state.viewMode === "sessions") {
        if (state.selectedIndex === 0) {
          // Create new session
          return { type: "state", state: enterNewTaskMode(state) };
        }
        // Select existing session
        const session = state.sessions[state.selectedIndex - 1];
        if (session) {
          return {
            type: "result",
            result: {
              type: "select",
              sessionId: session.id,
              selectedIndex: state.selectedIndex,
            },
          };
        }
      }
      return { type: "state", state };

    case "back":
      if (state.viewMode === "new_task_input") {
        return { type: "state", state: exitNewTaskMode(state) };
      }
      return { type: "state", state };

    case "input":
      if (state.viewMode === "new_task_input") {
        return { type: "state", state: appendTaskInput(state, action.char) };
      }
      return { type: "state", state };

    case "backspace":
      if (state.viewMode === "new_task_input") {
        return { type: "state", state: deleteTaskInputChar(state) };
      }
      return { type: "state", state };

    case "submit":
      if (state.viewMode === "new_task_input" && state.taskInput.trim()) {
        return {
          type: "result",
          result: { type: "new", task: state.taskInput.trim() },
        };
      }
      return { type: "state", state };

    default:
      return { type: "state", state };
  }
}
