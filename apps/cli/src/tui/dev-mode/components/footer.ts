/**
 * Footer component for dev mode TUI
 */

import type { ScrollInfo, ViewMode } from "../../../types/tui.js";
import { colors } from "../../ansi.js";

/**
 * Build scroll position indicator parts
 */
function buildScrollParts(
  scrollInfo: ScrollInfo,
  showBottomHint: boolean
): string[] {
  const { offset, outputHeight, totalLines, userScrolled } = scrollInfo;
  const parts: string[] = [];

  if (totalLines > outputHeight) {
    const endLine = Math.min(offset + outputHeight, totalLines);
    const scrollPos = `${offset + 1}-${endLine}/${totalLines}`;

    if (userScrolled) {
      parts.push(`${colors.yellow}${scrollPos}${colors.reset}`);
      if (showBottomHint) {
        parts.push(`${colors.dim}G${colors.reset} bottom`);
      }
    } else {
      parts.push(`${colors.dim}${scrollPos}${colors.reset}`);
    }
  } else if (totalLines > 0 && showBottomHint) {
    parts.push(`${colors.dim}L:${totalLines}${colors.reset}`);
  }

  return parts;
}

/**
 * Build footer content for logs view with scroll info
 */
function buildLogsFooter(scrollInfo: ScrollInfo): string {
  const parts: string[] = [];

  parts.push(`${colors.dim}j/k${colors.reset} scroll`);
  parts.push(...buildScrollParts(scrollInfo, true));
  parts.push(`${colors.dim}t${colors.reset} tasks`);
  parts.push(`${colors.dim}^C${colors.reset} quit`);

  return ` ${parts.join("  ")} `;
}

/**
 * Build footer content for tasks list view
 */
function buildTasksListFooter(): string {
  const parts: string[] = [];

  parts.push(`${colors.dim}j/k${colors.reset} navigate`);
  parts.push(`${colors.dim}Enter${colors.reset} details`);
  parts.push(`${colors.dim}Esc${colors.reset} back`);
  parts.push(`${colors.dim}^C${colors.reset} quit`);

  return ` ${parts.join("  ")} `;
}

/**
 * Build footer content for task detail view
 */
function buildTaskDetailFooter(scrollInfo: ScrollInfo): string {
  const parts: string[] = [];

  parts.push(`${colors.dim}j/k${colors.reset} scroll`);
  parts.push(...buildScrollParts(scrollInfo, false));
  parts.push(`${colors.dim}Esc${colors.reset} back`);
  parts.push(`${colors.dim}^C${colors.reset} quit`);

  return ` ${parts.join("  ")} `;
}

/**
 * Build footer content based on current view mode
 */
export function buildFooterContent(
  scrollInfo: ScrollInfo,
  viewMode: ViewMode = "logs"
): string {
  switch (viewMode) {
    case "logs":
      return buildLogsFooter(scrollInfo);
    case "tasks":
      return buildTasksListFooter();
    case "task-detail":
      return buildTaskDetailFooter(scrollInfo);
    default:
      return buildLogsFooter(scrollInfo);
  }
}
