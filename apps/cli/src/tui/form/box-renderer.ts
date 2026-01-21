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
    `${pad}${colors.cyan}${box.horizontal.repeat(width)}${colors.reset}`
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

  // Top border
  console.log(
    `${pad}${colors.cyan}${box.topLeft}${box.horizontal.repeat(innerWidth)}${box.topRight}${colors.reset}`
  );

  // Label line
  const labelText = ` ${label} `;
  const labelPad = Math.max(0, innerWidth - stripAnsi(labelText).length);
  console.log(
    `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.brightWhite}${labelText}${colors.reset}${" ".repeat(labelPad)}${colors.cyan}${box.vertical}${colors.reset}`
  );

  // Hint line (if provided)
  if (hint) {
    const hintText = ` ${hint} `;
    const hintPad = Math.max(0, innerWidth - hintText.length);
    console.log(
      `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${hintText}${colors.reset}${" ".repeat(hintPad)}${colors.cyan}${box.vertical}${colors.reset}`
    );
  }

  // Separator
  console.log(
    `${pad}${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
  );

  // Content lines
  if (options?.content) {
    for (const line of options.content) {
      const lineText = ` ${line} `;
      const stripped = stripAnsi(lineText);
      const linePad = Math.max(0, innerWidth - stripped.length);
      console.log(
        `${pad}${colors.cyan}${box.vertical}${colors.reset}${lineText}${" ".repeat(linePad)}${colors.cyan}${box.vertical}${colors.reset}`
      );
    }
  }

  // Footer (if provided)
  if (options?.footer) {
    console.log(
      `${pad}${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
    );
    const footerText = ` ${options.footer} `;
    const footerPad = Math.max(0, innerWidth - stripAnsi(footerText).length);
    console.log(
      `${pad}${colors.cyan}${box.vertical}${colors.reset}${colors.dim}${footerText}${colors.reset}${" ".repeat(footerPad)}${colors.cyan}${box.vertical}${colors.reset}`
    );
  }

  // Bottom border
  console.log(
    `${pad}${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}${colors.reset}`
  );
}
