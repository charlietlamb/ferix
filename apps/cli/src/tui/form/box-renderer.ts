/**
 * Box rendering utilities for TUI forms
 */

import { UI } from "../../constants.js";
import { box, colors, getTerminalSize, stripAnsi } from "../ansi.js";

/**
 * Calculate horizontal padding for centering content
 */
export function calculatePadding(boxWidth: number, cols: number): number {
  return Math.max(0, Math.floor((cols - boxWidth) / 2));
}

/**
 * Draw a horizontal decorative line centered on screen
 */
export function drawHorizontalLine(width: number, cols: number): void {
  const padding = calculatePadding(width, cols);
  const pad = " ".repeat(padding);
  console.log(
    `${pad}${colors.cyan}${box.doubleHorizontal.repeat(width)}${colors.reset}`
  );
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
  const boxWidth = Math.min(UI.BOX_MAX_WIDTH, cols - UI.BOX_MARGIN);
  const innerWidth = boxWidth - 2;
  const padding = calculatePadding(boxWidth, cols);
  const pad = " ".repeat(padding);

  // Top border (double line)
  console.log(
    `${pad}${colors.cyan}${box.doubleTopLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleTopRight}${colors.reset}`
  );

  // Label line (double vertical borders)
  const labelText = ` ${label} `;
  const labelPad = Math.max(0, innerWidth - stripAnsi(labelText).length);
  console.log(
    `${pad}${colors.cyan}${box.doubleVertical}${colors.reset}${colors.brightWhite}${labelText}${colors.reset}${" ".repeat(labelPad)}${colors.cyan}${box.doubleVertical}${colors.reset}`
  );

  // Hint line (if provided)
  if (hint) {
    const hintText = ` ${hint} `;
    const hintPad = Math.max(0, innerWidth - hintText.length);
    console.log(
      `${pad}${colors.cyan}${box.doubleVertical}${colors.reset}${colors.dim}${hintText}${colors.reset}${" ".repeat(hintPad)}${colors.cyan}${box.doubleVertical}${colors.reset}`
    );
  }

  // Separator (double tees with single horizontal)
  console.log(
    `${pad}${colors.cyan}${box.doubleTeeRight}${box.horizontal.repeat(innerWidth)}${box.doubleTeeLeft}${colors.reset}`
  );

  // Content lines (double vertical borders)
  if (options?.content) {
    for (const line of options.content) {
      const lineText = ` ${line} `;
      const stripped = stripAnsi(lineText);
      const linePad = Math.max(0, innerWidth - stripped.length);
      console.log(
        `${pad}${colors.cyan}${box.doubleVertical}${colors.reset}${lineText}${" ".repeat(linePad)}${colors.cyan}${box.doubleVertical}${colors.reset}`
      );
    }
  }

  // Footer (if provided)
  if (options?.footer) {
    console.log(
      `${pad}${colors.cyan}${box.doubleTeeRight}${box.horizontal.repeat(innerWidth)}${box.doubleTeeLeft}${colors.reset}`
    );
    const footerText = ` ${options.footer} `;
    const footerPad = Math.max(0, innerWidth - stripAnsi(footerText).length);
    console.log(
      `${pad}${colors.cyan}${box.doubleVertical}${colors.reset}${colors.dim}${footerText}${colors.reset}${" ".repeat(footerPad)}${colors.cyan}${box.doubleVertical}${colors.reset}`
    );
  }

  // Bottom border (double line)
  console.log(
    `${pad}${colors.cyan}${box.doubleBottomLeft}${box.doubleHorizontal.repeat(innerWidth)}${box.doubleBottomRight}${colors.reset}`
  );
}
