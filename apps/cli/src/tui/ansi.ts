/**
 * ANSI escape code utilities for terminal TUI
 */

import { UI } from "../constants.js";

// Escape sequence prefix
const ESC = "\x1b[";

// Screen control
export const screen = {
  clear: () => process.stdout.write(`${ESC}2J`),
  home: () => process.stdout.write(`${ESC}H`),
  moveTo: (row: number, col: number) =>
    process.stdout.write(`${ESC}${row};${col}H`),
  hideCursor: () => process.stdout.write(`${ESC}?25l`),
  showCursor: () => process.stdout.write(`${ESC}?25h`),
  alternateBuffer: () => process.stdout.write(`${ESC}?1049h`),
  normalBuffer: () => process.stdout.write(`${ESC}?1049l`),
};

// Colors
export const colors = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,

  // Foreground
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,

  // Bright foreground
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightCyan: `${ESC}96m`,
  brightWhite: `${ESC}97m`,
};

// Box drawing characters (single line for internal separators)
export const box = {
  horizontal: "─",
  vertical: "│",
  teeRight: "├",
  teeLeft: "┤",

  // Double line (for outer borders)
  doubleHorizontal: "═",
  doubleVertical: "║",
  doubleTopLeft: "╔",
  doubleTopRight: "╗",
  doubleBottomLeft: "╚",
  doubleBottomRight: "╝",
  doubleTeeRight: "╠",
  doubleTeeLeft: "╣",
};

// Get terminal dimensions
export function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || UI.DEFAULT_TERMINAL_ROWS,
    cols: process.stdout.columns || UI.DEFAULT_TERMINAL_COLS,
  };
}

// Strip ANSI escape codes for length calculation
export function stripAnsi(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: needed for ANSI stripping
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

// Truncate with ellipsis
export function truncate(str: string, maxWidth: number): string {
  const stripped = stripAnsi(str);
  if (stripped.length <= maxWidth) {
    return str;
  }
  return `${stripped.substring(0, maxWidth - 3)}...`;
}
