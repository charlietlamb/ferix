/**
 * Renderer for dev mode TUI
 */

import type { DevModeState, ScrollInfo } from "../../types/tui.js";
import { box, colors, getTerminalSize, screen, stripAnsi } from "../ansi.js";
import {
  buildFooterContent,
  buildStatusBarContent,
  buildTaskBarContent,
  buildTaskDetailContent,
  buildTasksListContent,
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
 * Render a bordered line with content (double vertical borders)
 */
function borderedLine(content: string, innerWidth: number): void {
  const contentLen = stripAnsi(content).length;
  const padding = Math.max(0, innerWidth - contentLen);
  writeLine(
    `${colors.cyan}${box.doubleVertical}${colors.reset}${content}${" ".repeat(padding)}${colors.cyan}${box.doubleVertical}${colors.reset}`
  );
}

/**
 * Render output area rows (logs view)
 */
function renderLogsView(
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
 * Render tasks list view
 */
function renderTasksListView(
  state: DevModeState,
  scrollOffset: number,
  height: number,
  innerWidth: number
): void {
  const contentLines = buildTasksListContent(state, innerWidth, height);
  const visibleLines = contentLines.slice(scrollOffset, scrollOffset + height);

  for (let i = 0; i < height; i++) {
    const line = visibleLines[i] ?? "";
    const contentLen = stripAnsi(line).length;
    const padding = Math.max(0, innerWidth - contentLen);
    writeLine(
      `${colors.cyan}${box.doubleVertical}${colors.reset}${line}${" ".repeat(padding)}${colors.cyan}${box.doubleVertical}${colors.reset}`
    );
  }
}

/**
 * Render task detail view
 */
function renderTaskDetailView(
  state: DevModeState,
  scrollOffset: number,
  height: number,
  innerWidth: number
): void {
  const contentLines = buildTaskDetailContent(state, innerWidth, height);
  const visibleLines = contentLines.slice(scrollOffset, scrollOffset + height);

  for (let i = 0; i < height; i++) {
    const line = visibleLines[i] ?? "";
    const contentLen = stripAnsi(line).length;
    const padding = Math.max(0, innerWidth - contentLen);
    writeLine(
      `${colors.cyan}${box.doubleVertical}${colors.reset}${line}${" ".repeat(padding)}${colors.cyan}${box.doubleVertical}${colors.reset}`
    );
  }
}

/**
 * Render the full dev mode screen
 */
export function render(state: DevModeState, scrollInfo: ScrollInfo): void {
  const { rows, cols } = getTerminalSize();
  const innerWidth = cols - 2;
  const outputHeight = rows - FIXED_ROWS;

  screen.home();

  // Row 1: Top border (double line)
  writeLine(
    `${colors.cyan}${box.doubleTopLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleTopRight}${colors.reset}`
  );

  // Row 2: Status bar
  borderedLine(buildStatusBarContent(state), innerWidth);

  // Row 3: Task bar
  borderedLine(buildTaskBarContent(state.task, innerWidth), innerWidth);

  // Row 4: Header/content separator (double tees connecting to double verticals)
  writeLine(
    `${colors.cyan}${box.doubleTeeRight}${box.horizontal.repeat(innerWidth)}${box.doubleTeeLeft}${colors.reset}`
  );

  // Rows 5 to (rows-3): Content area (view-dependent)
  if (state.viewMode === "tasks") {
    renderTasksListView(
      state,
      state.tasksListState.scrollOffset,
      outputHeight,
      innerWidth
    );
  } else if (state.viewMode === "task-detail") {
    renderTaskDetailView(
      state,
      state.tasksListState.scrollOffset,
      outputHeight,
      innerWidth
    );
  } else {
    renderLogsView(state, scrollInfo.offset, outputHeight, innerWidth);
  }

  // Row (rows-2): Content/footer separator (double tees connecting to double verticals)
  writeLine(
    `${colors.cyan}${box.doubleTeeRight}${box.horizontal.repeat(innerWidth)}${box.doubleTeeLeft}${colors.reset}`
  );

  // Row (rows-1): Footer (view-dependent)
  borderedLine(buildFooterContent(scrollInfo, state.viewMode), innerWidth);

  // Row (rows): Bottom border (double line, no newline at end)
  process.stdout.write(
    `${colors.cyan}${box.doubleBottomLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleBottomRight}${colors.reset}`
  );
}
