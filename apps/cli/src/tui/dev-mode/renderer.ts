/**
 * Renderer for dev mode TUI
 */

import type { DevModeState } from "../../types/tui.js";
import { box, colors, getTerminalSize, screen, stripAnsi } from "../ansi.js";
import {
  buildFooterContent,
  buildStatusBarContent,
  buildTaskBarContent,
  formatOutputLine,
  getVisibleLines,
} from "./components/index.js";
import { FIXED_ROWS } from "./layout.js";

/**
 * Write a line with newline
 */
function writeLine(content: string): void {
  process.stdout.write(`${content}\n`);
}

/**
 * Render a bordered line with content
 */
function borderedLine(content: string, innerWidth: number): void {
  const contentLen = stripAnsi(content).length;
  const padding = Math.max(0, innerWidth - contentLen);
  writeLine(
    `${colors.cyan}${box.vertical}${colors.reset}${content}${" ".repeat(padding)}${colors.cyan}${box.vertical}${colors.reset}`
  );
}

/**
 * Render output area rows
 */
function renderOutputRows(
  state: DevModeState,
  scrollOffset: number,
  height: number,
  innerWidth: number
): void {
  const visibleLines = getVisibleLines(state.outputLines, scrollOffset, height);

  for (let i = 0; i < height; i++) {
    const line = visibleLines[i] ?? "";
    const displayLine = formatOutputLine(line, innerWidth);
    borderedLine(displayLine, innerWidth);
  }
}

/**
 * Render the full dev mode screen
 */
export function render(
  state: DevModeState,
  scrollOffset: number,
  isWaitingForExit: boolean
): void {
  const { rows, cols } = getTerminalSize();
  const innerWidth = cols - 2;
  const outputHeight = rows - FIXED_ROWS;

  screen.home();

  // Row 1: Top border
  writeLine(
    `${colors.cyan}${box.topLeft}${box.horizontal.repeat(innerWidth)}${box.topRight}${colors.reset}`
  );

  // Row 2: Status bar
  borderedLine(buildStatusBarContent(state), innerWidth);

  // Row 3: Task bar
  borderedLine(buildTaskBarContent(state.task, innerWidth), innerWidth);

  // Row 4: Header/content separator
  writeLine(
    `${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
  );

  // Rows 5 to (rows-3): Output area
  renderOutputRows(state, scrollOffset, outputHeight, innerWidth);

  // Row (rows-2): Content/footer separator
  writeLine(
    `${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
  );

  // Row (rows-1): Footer
  borderedLine(
    buildFooterContent(isWaitingForExit, state.outputLines.length),
    innerWidth
  );

  // Row (rows): Bottom border (no newline at end)
  process.stdout.write(
    `${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}${colors.reset}`
  );
}
