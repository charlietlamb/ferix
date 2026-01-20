/**
 * ANSI escape code utilities for terminal TUI
 */

// Escape sequence prefix
const ESC = "\x1b[";

// Screen control
export const screen = {
  clear: () => process.stdout.write(`${ESC}2J`),
  clearLine: () => process.stdout.write(`${ESC}2K`),
  clearDown: () => process.stdout.write(`${ESC}J`),
  home: () => process.stdout.write(`${ESC}H`),
  moveTo: (row: number, col: number) =>
    process.stdout.write(`${ESC}${row};${col}H`),
  moveUp: (n = 1) => process.stdout.write(`${ESC}${n}A`),
  moveDown: (n = 1) => process.stdout.write(`${ESC}${n}B`),
  saveCursor: () => process.stdout.write(`${ESC}s`),
  restoreCursor: () => process.stdout.write(`${ESC}u`),
  hideCursor: () => process.stdout.write(`${ESC}?25l`),
  showCursor: () => process.stdout.write(`${ESC}?25h`),
  alternateBuffer: () => process.stdout.write(`${ESC}?1049h`),
  normalBuffer: () => process.stdout.write(`${ESC}?1049l`),
};

// Colors (retro/dev style)
export const colors = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  blink: `${ESC}5m`,
  reverse: `${ESC}7m`,

  // Foreground
  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,

  // Bright foreground
  brightBlack: `${ESC}90m`,
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
  brightWhite: `${ESC}97m`,

  // Background
  bgBlack: `${ESC}40m`,
  bgRed: `${ESC}41m`,
  bgGreen: `${ESC}42m`,
  bgYellow: `${ESC}43m`,
  bgBlue: `${ESC}44m`,
  bgMagenta: `${ESC}45m`,
  bgCyan: `${ESC}46m`,
  bgWhite: `${ESC}47m`,

  // Bright background
  bgBrightBlack: `${ESC}100m`,
  bgBrightGreen: `${ESC}102m`,
};

// Text styling helpers
export const style = {
  header: (text: string) =>
    `${colors.bold}${colors.cyan}${text}${colors.reset}`,
  success: (text: string) => `${colors.brightGreen}${text}${colors.reset}`,
  error: (text: string) => `${colors.brightRed}${text}${colors.reset}`,
  warning: (text: string) => `${colors.brightYellow}${text}${colors.reset}`,
  info: (text: string) => `${colors.brightBlue}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
  bold: (text: string) => `${colors.bold}${text}${colors.reset}`,
  tool: (text: string) => `${colors.magenta}${text}${colors.reset}`,
  file: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  command: (text: string) => `${colors.green}${text}${colors.reset}`,
};

// Box drawing characters (retro style)
export const box = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  teeRight: "├",
  teeLeft: "┤",
  teeDown: "┬",
  teeUp: "┴",
  cross: "┼",

  // Double line (for headers)
  doubleHorizontal: "═",
  doubleVertical: "║",
  doubleTopLeft: "╔",
  doubleTopRight: "╗",
  doubleBottomLeft: "╚",
  doubleBottomRight: "╝",
};

// Get terminal dimensions
export function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 24,
    cols: process.stdout.columns || 80,
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
