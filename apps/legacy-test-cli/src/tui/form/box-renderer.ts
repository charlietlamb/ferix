/**
 * Box rendering utilities for TUI forms
 * Uses box-primitives for consistent rendering
 */

import { box, colors, getTerminalSize } from "../ansi.js";
import {
  calculateBoxLayout,
  drawBottomBorder,
  drawContentLine,
  drawSeparator,
  drawTopBorder,
} from "./box-primitives.js";

// Re-export for backwards compatibility
export { type BoxLayout, calculateBoxLayout } from "./box-primitives.js";

/**
 * Calculate horizontal padding for centering content
 * @deprecated Use calculateBoxLayout instead
 */
export function calculatePadding(boxWidth: number, cols: number): number {
  return Math.max(0, Math.floor((cols - boxWidth) / 2));
}

/**
 * Draw a horizontal decorative line centered on screen (custom width)
 */
export function drawHorizontalLine(width: number, cols: number): void {
  const padding = Math.max(0, Math.floor((cols - width) / 2));
  const pad = " ".repeat(padding);
  console.log(
    `${pad}${colors.cyan}${box.doubleHorizontal.repeat(width)}${colors.reset}`
  );
}

/**
 * Draw a horizontal decorative line centered on screen (uses box width)
 */
export function drawHorizontalDecorativeLine(cols: number): void {
  const layout = calculateBoxLayout(cols);
  // Use the box width (innerWidth + 2 borders)
  drawHorizontalLine(layout.boxWidth, cols);
}

/**
 * Options for rendering a question box
 */
export interface QuestionBoxOptions {
  content?: string[];
  footer?: string;
}

/**
 * Render a bordered question box with optional content and footer
 */
export function renderQuestionBox(
  label: string,
  hint?: string,
  options?: QuestionBoxOptions
): void {
  const { cols } = getTerminalSize();
  const layout = calculateBoxLayout(cols);

  // Top border
  console.log(drawTopBorder(layout));

  // Label line
  console.log(drawContentLine(layout, label, { bright: true }));

  // Hint line (if provided)
  if (hint) {
    console.log(drawContentLine(layout, hint, { dim: true }));
  }

  // Separator
  console.log(drawSeparator(layout));

  // Content lines
  if (options?.content) {
    for (const line of options.content) {
      console.log(drawContentLine(layout, line));
    }
  }

  // Footer (if provided)
  if (options?.footer) {
    console.log(drawSeparator(layout));
    console.log(drawContentLine(layout, options.footer, { dim: true }));
  }

  // Bottom border
  console.log(drawBottomBorder(layout));
}
