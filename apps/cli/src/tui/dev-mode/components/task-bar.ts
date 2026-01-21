/**
 * Task bar component for dev mode TUI
 */

import { colors, truncate } from "../../ansi.js";

/**
 * Build task bar content
 */
export function buildTaskBarContent(task: string, innerWidth: number): string {
  const label = `${colors.dim}TASK:${colors.reset}`;
  // Account for: space + "TASK:" (5 chars) + space + task + space = 8 chars overhead
  // Also replace newlines with spaces to keep it on one line
  const cleanTask = task.replace(/\n/g, " ");
  const taskText = truncate(cleanTask, innerWidth - 9);
  return ` ${label} ${taskText} `;
}
