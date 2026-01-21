/**
 * Tool color mappings for terminal display
 */

import { colors } from "../../tui/ansi.js";

/**
 * Tool colors for terminal display - single source of truth
 */
export const TOOL_COLORS: Record<string, string> = {
  Read: colors.cyan,
  Edit: colors.yellow,
  Write: colors.green,
  Bash: colors.magenta,
  Glob: colors.blue,
  Grep: colors.blue,
  Task: colors.brightWhite,
  WebFetch: colors.cyan,
  WebSearch: colors.blue,
  TodoWrite: colors.green,
};

/**
 * Get color for tool type - each tool category has a distinct color
 */
export function getToolColor(tool: string): string {
  return TOOL_COLORS[tool] ?? colors.dim;
}
