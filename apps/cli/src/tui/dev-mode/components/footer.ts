/**
 * Footer component for dev mode TUI
 */

import type { ScrollInfo, ViewMode } from "../../../types/tui.js";
import { colors, symbols } from "../../ansi.js";

/**
 * Format a hint with diamond bullet prefix
 * @param key - The key binding (styled brightWhite)
 * @param description - The description (styled dim)
 */
function formatHint(key: string, description: string): string {
  return `${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}${key}${colors.reset} ${colors.dim}${description}${colors.reset}`;
}

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
        parts.push(
          `${colors.brightWhite}G${colors.reset} ${colors.dim}bottom${colors.reset}`
        );
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

  parts.push(formatHint("j/k", "scroll"));
  parts.push(...buildScrollParts(scrollInfo, true));
  parts.push(formatHint("t", "tasks"));
  parts.push(formatHint("^C", "quit"));

  return ` ${parts.join("  ")} `;
}

/**
 * Build footer content for tasks list view
 */
function buildTasksListFooter(): string {
  const parts: string[] = [];

  parts.push(formatHint("j/k", "navigate"));
  parts.push(formatHint("Enter", "details"));
  parts.push(formatHint("Esc", "back"));
  parts.push(formatHint("^C", "quit"));

  return ` ${parts.join("  ")} `;
}

/**
 * Build footer content for task detail view
 */
function buildTaskDetailFooter(scrollInfo: ScrollInfo): string {
  const parts: string[] = [];

  parts.push(formatHint("j/k", "scroll"));
  parts.push(...buildScrollParts(scrollInfo, false));
  parts.push(formatHint("Esc", "back"));
  parts.push(formatHint("^C", "quit"));

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
