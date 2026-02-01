import type { TUIState } from "../../../domain/schemas/tui.js";
import { styleFerixTags } from "../tags.js";
import { borderedLine, stripAnsi, truncate } from "./primitives.js";

export function renderOutputArea(
  state: TUIState,
  height: number,
  width: number
): string[] {
  const lines: string[] = [];
  const { outputLines, scrollOffset, userScrolled } = state;

  // Handle edge case: no output lines
  if (height <= 0) {
    return [];
  }

  // Calculate visible range
  const totalLines = outputLines.length;
  const maxOffset = Math.max(0, totalLines - height);

  // If user hasn't scrolled, show latest lines (auto-scroll)
  // If user has scrolled, respect their scroll offset (clamped to valid range)
  let startIndex: number;
  if (userScrolled) {
    // Manual scroll: respect offset but clamp to valid range
    const clampedOffset = Math.max(0, Math.min(scrollOffset, maxOffset));
    startIndex = clampedOffset;
  } else {
    // Auto-scroll: show the last 'height' lines
    startIndex = maxOffset;
  }

  // Ensure startIndex is valid
  startIndex = Math.max(0, Math.min(startIndex, Math.max(0, totalLines - 1)));

  const visibleLines = outputLines.slice(startIndex, startIndex + height);

  // Render each line with tag styling
  const innerWidth = width - 4; // Account for borders and padding

  for (let i = 0; i < height; i++) {
    const line = visibleLines[i] ?? "";

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
