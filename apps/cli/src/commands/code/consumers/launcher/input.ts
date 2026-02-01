import {
  appendTaskInput,
  deleteTaskInputChar,
  enterNewTaskMode,
  exitNewTaskMode,
  type LauncherResult,
  type LauncherState,
  type LauncherViewMode,
  navigate,
  scrollList,
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
  | { readonly type: "new_session" }
  | { readonly type: "stop_daemon" }
  | { readonly type: "open_pr" }
  | { readonly type: "back" }
  | { readonly type: "quit" }
  | { readonly type: "input"; readonly char: string }
  | { readonly type: "backspace" }
  | { readonly type: "submit" }
  | { readonly type: "scroll"; readonly delta: number }
  | { readonly type: "none" };

/**
 * Side effects that can be triggered by actions.
 */
type LauncherSideEffect =
  | { readonly type: "stop_daemon" }
  | { readonly type: "open_pr"; readonly url: string };

/**
 * Result of applying an action to the launcher state.
 */
export type ApplyActionResult =
  | { readonly type: "state"; readonly state: LauncherState }
  | { readonly type: "result"; readonly result: LauncherResult }
  | {
      readonly type: "effect";
      readonly state: LauncherState;
      readonly effect: LauncherSideEffect;
    };

/** Mouse wheel escape sequence pattern */
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for mouse parsing
const MOUSE_WHEEL_REGEX = /\x1b\[<(\d+);(\d+);(\d+)[Mm]/;

/**
 * Parse mouse wheel input.
 */
function parseMouseWheel(key: string): LauncherKeyAction | null {
  const mouseMatch = key.match(MOUSE_WHEEL_REGEX);
  if (!mouseMatch) {
    return null;
  }
  const btnStr = mouseMatch[1];
  if (!btnStr) {
    return null;
  }
  const btn = Number.parseInt(btnStr, 10);
  if (btn === 64) {
    return { type: "scroll", delta: -3 }; // scroll up
  }
  if (btn === 65) {
    return { type: "scroll", delta: 3 }; // scroll down
  }
  return null;
}

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

  // Check for mouse wheel in sessions view
  if (viewMode === "sessions") {
    const mouseAction = parseMouseWheel(key);
    if (mouseAction) {
      return mouseAction;
    }
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
    // New session shortcut
    case "n":
      return { type: "new_session" };
    // Daemon control
    case "d":
      return { type: "stop_daemon" };
    // Open PR in browser
    case "o":
      return { type: "open_pr" };
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
 * Handle select action in sessions view.
 */
function handleSelect(state: LauncherState): ApplyActionResult {
  if (state.selectedIndex === 0) {
    return { type: "state", state: enterNewTaskMode(state) };
  }
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
  return { type: "state", state };
}

/**
 * Get the selected session's PR URL if available.
 */
function getSelectedPrUrl(state: LauncherState): string | undefined {
  if (state.selectedIndex === 0) {
    return undefined;
  }
  const session = state.sessions[state.selectedIndex - 1];
  return session?.prUrl;
}

/**
 * Handle actions in sessions view mode.
 */
function applySessionsAction(
  state: LauncherState,
  action: LauncherKeyAction,
  unchanged: ApplyActionResult
): ApplyActionResult {
  switch (action.type) {
    case "navigate":
      return { type: "state", state: navigate(state, action.direction) };
    case "select":
      return handleSelect(state);
    case "new_session":
      return { type: "state", state: enterNewTaskMode(state) };
    case "stop_daemon":
      if (state.daemon.running) {
        return { type: "effect", state, effect: { type: "stop_daemon" } };
      }
      return unchanged;
    case "open_pr": {
      const prUrl = getSelectedPrUrl(state);
      if (prUrl) {
        return {
          type: "effect",
          state,
          effect: { type: "open_pr", url: prUrl },
        };
      }
      return unchanged;
    }
    case "scroll":
      return { type: "state", state: scrollList(state, action.delta) };
    default:
      return unchanged;
  }
}

/**
 * Handle actions in input view mode.
 */
function applyInputAction(
  state: LauncherState,
  action: LauncherKeyAction,
  unchanged: ApplyActionResult
): ApplyActionResult {
  switch (action.type) {
    case "back":
      return { type: "state", state: exitNewTaskMode(state) };
    case "input":
      return { type: "state", state: appendTaskInput(state, action.char) };
    case "backspace":
      return { type: "state", state: deleteTaskInputChar(state) };
    case "submit":
      if (state.taskInput.trim()) {
        return {
          type: "result",
          result: { type: "new", task: state.taskInput.trim() },
        };
      }
      return unchanged;
    default:
      return unchanged;
  }
}

/**
 * Apply an action to the launcher state.
 * Returns either a new state or a final result.
 */
export function applyAction(
  state: LauncherState,
  action: LauncherKeyAction
): ApplyActionResult {
  const unchanged: ApplyActionResult = { type: "state", state };

  // Global actions
  if (action.type === "quit") {
    return { type: "result", result: { type: "quit" } };
  }

  // Dispatch based on view mode
  if (state.viewMode === "sessions") {
    return applySessionsAction(state, action, unchanged);
  }
  return applyInputAction(state, action, unchanged);
}
