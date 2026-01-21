/**
 * Output area component for dev mode TUI
 */

import { colors, stripAnsi, truncate } from "../../ansi.js";

/**
 * Get visible output lines for display
 */
export function getVisibleLines(
  outputLines: string[],
  scrollOffset: number,
  height: number
): string[] {
  return outputLines.slice(scrollOffset, scrollOffset + height);
}

/**
 * Style ferix tags in a line for beautiful display
 */
function styleFerixTags(line: string, width: number): string {
  // Style <ferix:tasks> - full width top border with TASKS label
  if (line.includes("<ferix:tasks>")) {
    const label = " TASKS ";
    const remainingWidth = width - 3 - label.length; // 3 for "┌─" and spacing
    const border = "─".repeat(Math.max(0, remainingWidth));
    return line.replace(
      /<ferix:tasks>/g,
      `${colors.cyan}┌─${colors.brightCyan}${label}${colors.cyan}${border}${colors.reset}`
    );
  }

  // Style </ferix:tasks> - full width bottom border
  if (line.includes("</ferix:tasks>")) {
    const border = "─".repeat(Math.max(0, width - 2));
    return line.replace(
      /<\/ferix:tasks>/g,
      `${colors.cyan}└${border}┘${colors.reset}`
    );
  }

  // Style <task id="N">...</task> with left border
  let styled = line.replace(
    /<task id="(\d+)">([^<]+)<\/task>/g,
    `${colors.cyan}│${colors.reset} ${colors.yellow}[$1]${colors.reset} $2`
  );

  // Style <ferix:task-done id="N"/>
  styled = styled.replace(
    /<ferix:task-done id="(\d+)"\/>/g,
    `${colors.green}✓${colors.reset} ${colors.dim}Task $1 complete${colors.reset}`
  );

  // Style <ferix:complete> - full width
  if (styled.includes("<ferix:complete>")) {
    const label = " ALL TASKS COMPLETE ";
    const sideWidth = Math.max(0, Math.floor((width - label.length) / 2));
    const leftBorder = "━".repeat(sideWidth);
    const rightBorder = "━".repeat(width - sideWidth - label.length);
    styled = styled.replace(
      /<ferix:complete>/g,
      `${colors.brightGreen}${leftBorder}${label}${rightBorder}${colors.reset}`
    );
  }

  // Style <ferix:error>...</ferix:error>
  styled = styled.replace(
    /<ferix:error>([^<]*)<\/ferix:error>/g,
    `${colors.brightRed}ERROR:${colors.reset} ${colors.red}$1${colors.reset}`
  );

  return styled;
}

/**
 * Format a single output line for display
 */
export function formatOutputLine(line: string, innerWidth: number): string {
  const contentWidth = innerWidth - 2; // Account for padding spaces
  const styled = styleFerixTags(line, contentWidth);
  const strippedLen = stripAnsi(styled).length;

  // If the styled content is shorter than content width, we just pad
  // If longer, we truncate
  if (strippedLen <= contentWidth) {
    return ` ${styled} `;
  }
  return ` ${truncate(styled, contentWidth)} `;
}

/**
 * Calculate scroll offset to keep latest content visible
 */
export function calculateScrollOffset(
  outputLines: string[],
  outputHeight: number,
  currentOffset: number
): number {
  if (outputLines.length > outputHeight) {
    return outputLines.length - outputHeight;
  }
  return currentOffset;
}
