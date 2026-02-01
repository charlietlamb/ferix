import pc from "picocolors";
import {
  borderedLine,
  colors,
  emptyBorderedLine,
  stripAnsi,
  symbols,
  truncate,
} from "../../tui/render/primitives.js";
import type { LauncherSession, LauncherState } from "../state.js";

/**
 * Format a relative time string from an ISO date.
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  if (diffMins > 0) {
    return `${diffMins}m ago`;
  }
  return "now";
}

/**
 * Get status icon for a session.
 */
function getStatusIcon(status: LauncherSession["status"]): string {
  switch (status) {
    case "active":
      return colors.warning(symbols.bulletFilled);
    case "completed":
      return colors.success(symbols.checkmark);
    case "failed":
      return colors.error(symbols.cross);
    case "paused":
      return colors.muted(symbols.bulletEmpty);
    default:
      return colors.muted(symbols.bulletEmpty);
  }
}

/**
 * Render a single session row.
 */
function renderSessionRow(
  session: LauncherSession,
  isSelected: boolean,
  width: number
): string {
  const prefix = isSelected ? colors.brand(symbols.arrow) : " ";
  const icon = getStatusIcon(session.status);
  const name = session.displayName || truncateTask(session.originalTask);
  const time = formatRelativeTime(session.createdAt);

  // Calculate available width for name
  // Format: "  ▸ [icon] name                time"
  // prefix(2) + space(1) + icon(1) + space(1) + name + space(2) + time
  const fixedWidth = 2 + 1 + 1 + 1 + 2 + stripAnsi(time).length;
  const nameWidth = Math.max(10, width - fixedWidth - 8); // 8 for borders and padding

  const displayName = truncate(name, nameWidth);
  const paddedName = displayName.padEnd(
    nameWidth + (stripAnsi(displayName).length - displayName.length),
    " "
  );

  const content = `${prefix} ${icon} ${paddedName}  ${colors.muted(time)}`;
  return borderedLine(content, width);
}

/**
 * Truncate a task description for display.
 */
function truncateTask(task: string): string {
  // Remove newlines and extra spaces
  const cleaned = task.replace(/\s+/g, " ").trim();
  return cleaned;
}

/**
 * Render the "Create new session" row.
 */
function renderCreateNewRow(isSelected: boolean, width: number): string {
  const prefix = isSelected ? colors.brand(symbols.arrow) : " ";
  const icon = colors.brightGreen("+");
  const text = "Create new session";
  const content = `${prefix} [${icon}] ${colors.brightWhite(text)}`;
  return borderedLine(content, width);
}

/**
 * Render the sessions list view.
 */
export function renderSessionsList(
  state: LauncherState,
  width: number,
  availableHeight: number
): string[] {
  const lines: string[] = [];

  // Empty line for spacing
  lines.push(emptyBorderedLine(width));

  // "Create new session" option at index 0
  lines.push(renderCreateNewRow(state.selectedIndex === 0, width));

  // Session rows
  for (let i = 0; i < state.sessions.length; i++) {
    const session = state.sessions[i];
    if (!session) {
      continue;
    }
    const isSelected = state.selectedIndex === i + 1;
    lines.push(renderSessionRow(session, isSelected, width));
  }

  // Fill remaining space with empty lines
  while (lines.length < availableHeight) {
    lines.push(emptyBorderedLine(width));
  }

  return lines.slice(0, availableHeight);
}

/**
 * Render the new task input view.
 */
export function renderNewTaskInput(
  state: LauncherState,
  width: number,
  availableHeight: number
): string[] {
  const lines: string[] = [];

  lines.push(emptyBorderedLine(width));
  lines.push(borderedLine("  Enter task description:", width));
  lines.push(emptyBorderedLine(width));

  // Input line with cursor
  const inputPrefix = `  ${colors.brand(symbols.arrow)} `;
  const cursor = pc.inverse(" ");
  const inputContent = `${inputPrefix}${state.taskInput}${cursor}`;
  lines.push(borderedLine(inputContent, width));

  // Fill remaining space
  while (lines.length < availableHeight) {
    lines.push(emptyBorderedLine(width));
  }

  return lines.slice(0, availableHeight);
}
