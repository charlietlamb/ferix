/**
 * Low-level box drawing primitives for TUI forms
 * These functions output individual box components that can be composed
 */

import { UI } from "../../constants.js";
import { box, colors, getTerminalSize, stripAnsi } from "../ansi.js";

/**
 * Box layout dimensions and positioning
 */
export interface BoxLayout {
  /** Total box width including borders */
  boxWidth: number;
  /** Inner width (boxWidth - 2 for borders) */
  innerWidth: number;
  /** Left padding for horizontal centering */
  padding: number;
  /** Padding string (spaces) */
  pad: string;
}

/**
 * Calculate box layout dimensions for centering
 */
export function calculateBoxLayout(cols?: number): BoxLayout {
  const termCols = cols ?? getTerminalSize().cols;
  const boxWidth = Math.min(UI.BOX_MAX_WIDTH, termCols - UI.BOX_MARGIN);
  const innerWidth = boxWidth - 2;
  const padding = Math.max(0, Math.floor((termCols - boxWidth) / 2));
  const pad = " ".repeat(padding);

  return { boxWidth, innerWidth, padding, pad };
}

/**
 * Draw top border (double line)
 */
export function drawTopBorder(layout: BoxLayout): string {
  const { pad, innerWidth } = layout;
  return `${pad}${colors.cyan}${box.doubleTopLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleTopRight}${colors.reset}`;
}

/**
 * Draw bottom border (double line)
 */
export function drawBottomBorder(layout: BoxLayout): string {
  const { pad, innerWidth } = layout;
  return `${pad}${colors.cyan}${box.doubleBottomLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleBottomRight}${colors.reset}`;
}

/**
 * Draw horizontal separator (single line with double tees)
 */
export function drawSeparator(layout: BoxLayout): string {
  const { pad, innerWidth } = layout;
  return `${pad}${colors.cyan}${box.doubleTeeRight}${box.horizontal.repeat(innerWidth)}${box.doubleTeeLeft}${colors.reset}`;
}

/**
 * Draw a standalone horizontal decorative line (no border connections)
 */
export function drawHorizontalLine(layout: BoxLayout): string {
  const { pad, innerWidth } = layout;
  return `${pad}${colors.cyan}${box.doubleHorizontal.repeat(innerWidth + 2)}${colors.reset}`;
}

/**
 * Draw a content line with double vertical borders
 * Content is left-padded with 1 space by default
 */
export function drawContentLine(
  layout: BoxLayout,
  content: string,
  options?: {
    /** Skip left space padding */
    noLeftPad?: boolean;
    /** Color wrapper for content */
    color?: string;
    /** Apply dim style */
    dim?: boolean;
    /** Apply bright white style */
    bright?: boolean;
  }
): string {
  const { pad, innerWidth } = layout;
  const leftSpace = options?.noLeftPad ? "" : " ";
  const displayContent = `${leftSpace}${content}`;
  const contentLen = stripAnsi(displayContent).length;
  const rightPad = Math.max(0, innerWidth - contentLen);

  let styledContent = displayContent;
  if (options?.dim) {
    styledContent = `${colors.dim}${displayContent}${colors.reset}`;
  } else if (options?.bright) {
    styledContent = `${colors.brightWhite}${displayContent}${colors.reset}`;
  } else if (options?.color) {
    styledContent = `${options.color}${displayContent}${colors.reset}`;
  }

  return `${pad}${colors.cyan}${box.doubleVertical}${colors.reset}${styledContent}${" ".repeat(rightPad)}${colors.cyan}${box.doubleVertical}${colors.reset}`;
}

/**
 * Draw an empty content line
 */
export function drawEmptyLine(layout: BoxLayout): string {
  const { pad, innerWidth } = layout;
  return `${pad}${colors.cyan}${box.doubleVertical}${colors.reset}${" ".repeat(innerWidth)}${colors.cyan}${box.doubleVertical}${colors.reset}`;
}

/**
 * Calculate vertical padding for centering a box of given height
 */
export function calculateVerticalPadding(
  boxHeight: number,
  rows?: number
): number {
  const termRows = rows ?? getTerminalSize().rows;
  return Math.max(0, Math.floor((termRows - boxHeight) / 2));
}

/**
 * Print vertical padding (empty lines)
 */
export function printVerticalPadding(lines: number): void {
  for (let i = 0; i < lines; i++) {
    console.log();
  }
}
