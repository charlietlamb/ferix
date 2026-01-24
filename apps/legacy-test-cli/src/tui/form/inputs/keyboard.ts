/**
 * Keyboard input handling for text inputs
 */

import type { TextInputState, TextKeyAction } from "../../../types/tui.js";

/**
 * Parse a key press into an action
 */
export function parseTextKey(key: string): TextKeyAction {
  if (key === "\x03") {
    return { type: "cancel" };
  }
  // Shift+Enter / Alt+Enter / Ctrl+Enter variations
  // Common escape sequences for modified enter
  if (
    key === "\x1b\r" || // Alt+Enter
    key === "\x1b\n" || // Alt+Enter variant
    key === "\x1b[13;2u" || // Shift+Enter (kitty/modern terminals)
    key === "\x1b[13;5u" || // Ctrl+Enter (kitty/modern terminals)
    key === "\x1bOM" // Some terminals
  ) {
    return { type: "newline" };
  }
  if (key === "\r" || key === "\n") {
    return { type: "submit" };
  }
  if (key === "\x7f" || key === "\b") {
    return { type: "backspace" };
  }
  if (key === "\x1b[A") {
    return { type: "arrow", direction: "up" };
  }
  if (key === "\x1b[B") {
    return { type: "arrow", direction: "down" };
  }
  if (key === "\x1b[C") {
    return { type: "arrow", direction: "right" };
  }
  if (key === "\x1b[D") {
    return { type: "arrow", direction: "left" };
  }
  if (key.length === 1 && key >= " ") {
    return { type: "char", char: key };
  }
  return { type: "none" };
}

/**
 * Handle backspace key
 */
export function handleBackspace(state: TextInputState): void {
  const { inputLines, cursorLine, cursorCol } = state;
  if (cursorCol > 0) {
    const line = inputLines[cursorLine] || "";
    inputLines[cursorLine] =
      line.slice(0, cursorCol - 1) + line.slice(cursorCol);
    state.cursorCol--;
  } else if (cursorLine > 0) {
    const prevLine = inputLines[cursorLine - 1] || "";
    const currentLine = inputLines[cursorLine] || "";
    state.cursorCol = prevLine.length;
    inputLines[cursorLine - 1] = prevLine + currentLine;
    inputLines.splice(cursorLine, 1);
    state.cursorLine--;
  }
}

/**
 * Handle arrow key navigation
 */
export function handleArrow(
  state: TextInputState,
  direction: "up" | "down" | "left" | "right"
): void {
  const { inputLines, cursorLine, cursorCol } = state;
  switch (direction) {
    case "up":
      if (cursorLine > 0) {
        state.cursorLine--;
        state.cursorCol = Math.min(
          cursorCol,
          (inputLines[state.cursorLine] || "").length
        );
      }
      break;
    case "down":
      if (cursorLine < inputLines.length - 1) {
        state.cursorLine++;
        state.cursorCol = Math.min(
          cursorCol,
          (inputLines[state.cursorLine] || "").length
        );
      }
      break;
    case "right": {
      const line = inputLines[cursorLine] || "";
      if (cursorCol < line.length) {
        state.cursorCol++;
      } else if (cursorLine < inputLines.length - 1) {
        state.cursorLine++;
        state.cursorCol = 0;
      }
      break;
    }
    case "left":
      if (cursorCol > 0) {
        state.cursorCol--;
      } else if (cursorLine > 0) {
        state.cursorLine--;
        state.cursorCol = (inputLines[state.cursorLine] || "").length;
      }
      break;
    default:
      break;
  }
}

/**
 * Handle newline insertion
 */
export function handleNewline(state: TextInputState): void {
  const { inputLines, cursorLine, cursorCol } = state;
  const line = inputLines[cursorLine] || "";
  // Split current line at cursor position
  const beforeCursor = line.slice(0, cursorCol);
  const afterCursor = line.slice(cursorCol);
  inputLines[cursorLine] = beforeCursor;
  inputLines.splice(cursorLine + 1, 0, afterCursor);
  state.cursorLine++;
  state.cursorCol = 0;
}

/**
 * Handle character input
 */
export function handleCharInput(
  state: TextInputState,
  char: string,
  maxWidth: number
): void {
  const { inputLines, cursorLine, cursorCol } = state;
  const line = inputLines[cursorLine] || "";
  if (line.length >= maxWidth) {
    inputLines.splice(cursorLine + 1, 0, char);
    state.cursorLine++;
    state.cursorCol = 1;
  } else {
    inputLines[cursorLine] =
      line.slice(0, cursorCol) + char + line.slice(cursorCol);
    state.cursorCol++;
  }
}
