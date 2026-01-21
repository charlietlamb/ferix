/**
 * Output area component for dev mode TUI
 */

import { truncate } from "../../ansi.js";

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
 * Format a single output line for display
 */
export function formatOutputLine(line: string, innerWidth: number): string {
  return ` ${truncate(line, innerWidth - 2)} `;
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
