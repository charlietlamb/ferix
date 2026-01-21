/**
 * Footer component for dev mode TUI
 */

import { colors } from "../../ansi.js";

/**
 * Build footer content
 */
export function buildFooterContent(
  isWaitingForExit: boolean,
  outputLineCount: number
): string {
  if (isWaitingForExit) {
    return ` ${colors.brightWhite}>> Press any key to exit${colors.reset} `;
  }

  const parts = [`${colors.dim}^C${colors.reset} quit`];

  if (outputLineCount > 0) {
    parts.push(`${colors.dim}L:${colors.reset}${outputLineCount}`);
  }

  return ` ${parts.join("  ")} `;
}
