import type { TUIState } from "../state.js";
import { styleFerixTags } from "../tags.js";
import { borderedLine, stripAnsi, truncate } from "./primitives.js";

export function renderOutputArea(
  state: TUIState,
  height: number,
  width: number
): string[] {
  const lines: string[] = [];
  const { outputLines, scrollOffset, userScrolled } = state;

  // Calculate visible range
  const totalLines = outputLines.length;

  // If user hasn't scrolled, show latest lines (auto-scroll)
  // If user has scrolled, respect their scroll offset
  let startIndex: number;
  if (userScrolled) {
    // Manual scroll: respect offset
    startIndex = Math.min(scrollOffset, Math.max(0, totalLines - height));
  } else {
    // Auto-scroll: show the last 'height' lines
    startIndex = Math.max(0, totalLines - height);
  }

  const visibleLines = outputLines.slice(startIndex, startIndex + height);

  // Render each line with tag styling
  const innerWidth = width - 4; // Account for borders and padding

  for (let i = 0; i < height; i++) {
    const line = visibleLines[i] || "";

    // Apply ferix tag styling
    const styled = styleFerixTags(line, innerWidth);

    // Truncate if needed (accounting for ANSI codes)
    const truncated =
      stripAnsi(styled).length > innerWidth
        ? truncate(styled, innerWidth)
        : styled;

    lines.push(borderedLine(truncated, width));
  }

  return lines;
}

// Calculate max scroll offset for output area
export function getMaxOutputOffset(
  totalLines: number,
  outputHeight: number
): number {
  return Math.max(0, totalLines - outputHeight);
}
