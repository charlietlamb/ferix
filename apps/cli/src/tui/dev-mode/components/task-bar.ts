/**
 * Task bar component for dev mode TUI
 */

import { box, colors, symbols, truncate } from "../../ansi.js";

/**
 * Build task bar content
 */
export function buildTaskBarContent(task: string, innerWidth: number): string {
  // Label: ◆ TASK │ (magenta diamond, brightWhite "TASK", dim separator)
  const label = `${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}TASK${colors.reset} ${colors.dim}${box.vertical}${colors.reset}`;
  // Account for: space + "◆" (1) + space + "TASK" (4) + space + "│" (1) + space + task + space = 11 chars overhead
  // Also replace newlines with spaces to keep it on one line
  const cleanTask = task.replace(/\n/g, " ");
  const taskText = truncate(cleanTask, innerWidth - 11);
  return ` ${label} ${taskText} `;
}
