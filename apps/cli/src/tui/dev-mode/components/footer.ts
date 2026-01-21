/**
 * Footer component for dev mode TUI
 */

import type { ScrollInfo } from "../../../types/tui.js";
import { colors } from "../../ansi.js";

/**
 * Build footer content with scroll info
 */
export function buildFooterContent(
  isWaitingForExit: boolean,
  scrollInfo: ScrollInfo
): string {
  if (isWaitingForExit) {
    return ` ${colors.brightWhite}>> Press any key to exit${colors.reset} `;
  }

  const { offset, outputHeight, totalLines, userScrolled } = scrollInfo;
  const parts: string[] = [];

  // Scroll controls hint
  parts.push(`${colors.dim}j/k${colors.reset} scroll`);

  // Show scroll position if scrollable
  if (totalLines > outputHeight) {
    const endLine = Math.min(offset + outputHeight, totalLines);
    const scrollPos = `${offset + 1}-${endLine}/${totalLines}`;

    // Highlight if user has scrolled up (not at bottom)
    if (userScrolled) {
      parts.push(`${colors.yellow}${scrollPos}${colors.reset}`);
      parts.push(`${colors.dim}G${colors.reset} bottom`);
    } else {
      parts.push(`${colors.dim}${scrollPos}${colors.reset}`);
    }
  } else if (totalLines > 0) {
    parts.push(`${colors.dim}L:${totalLines}${colors.reset}`);
  }

  parts.push(`${colors.dim}^C${colors.reset} quit`);

  return ` ${parts.join("  ")} `;
}
