/**
 * Task bar component for dev mode TUI
 */

import { colors, truncate } from "../../ansi.js";

/**
 * Build task bar content
 */
export function buildTaskBarContent(task: string, innerWidth: number): string {
  const label = `${colors.dim}TASK:${colors.reset}`;
  const taskText = truncate(task, innerWidth - 8);
  return ` ${label} ${taskText} `;
}
