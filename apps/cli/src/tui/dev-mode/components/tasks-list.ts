/**
 * Tasks list view component for dev mode TUI
 * Shows navigable list of all tasks with phase summaries
 */

import type { Task } from "../../../types/config.js";
import type { DevModeState, GitInfo } from "../../../types/tui.js";
import { colors, hyperlink } from "../../ansi.js";
import { STATUS_ICONS } from "../layout.js";
import { formatDuration } from "../state.js";

/**
 * Get task status icon based on task state
 */
function getTaskStatusIcon(task: Task): string {
  if (task.done) {
    return STATUS_ICONS.done;
  }
  // Check if any phase is in progress
  const hasInProgress = task.phases.some((p) => p.status === "in_progress");
  if (hasInProgress) {
    return STATUS_ICONS.in_progress;
  }
  // Check if any phase has started
  const hasStarted = task.phases.some((p) => p.status !== "pending");
  if (hasStarted || task.startedAt) {
    return STATUS_ICONS.in_progress;
  }
  return STATUS_ICONS.pending;
}

/**
 * Get phase progress string (e.g., "2/4")
 */
function getPhaseProgress(task: Task): string {
  if (task.phases.length === 0) {
    return "0/0";
  }
  const completed = task.phases.filter((p) => p.status === "done").length;
  return `${completed}/${task.phases.length}`;
}

/**
 * Build a single task line for the list
 */
function buildTaskLine(
  task: Task,
  isSelected: boolean,
  maxDescWidth: number
): string {
  const selector = isSelected ? `${colors.brightCyan}>${colors.reset}` : " ";
  const icon = getTaskStatusIcon(task);
  const id = `${colors.yellow}[${task.id}]${colors.reset}`;

  // Truncate description if needed
  let description = task.description;
  if (description.length > maxDescWidth) {
    description = `${description.substring(0, maxDescWidth - 3)}...`;
  }

  // Duration (if started)
  const duration = task.startedAt
    ? formatDuration(task.startedAt, task.completedAt)
    : `${colors.dim}--${colors.reset}`;

  // Phase progress
  const progress = `${colors.dim}${getPhaseProgress(task)}${colors.reset}`;

  return `  ${selector} ${id} ${icon} ${description}  ${duration}  ${progress}`;
}

/**
 * Build git info section lines
 */
function buildGitInfoLines(gitInfo: GitInfo): string[] {
  const lines: string[] = [];

  if (!gitInfo.branch) {
    return lines;
  }

  // Branch info line
  const branchDisplay = gitInfo.baseBranch
    ? `${gitInfo.branch} → ${gitInfo.baseBranch}`
    : gitInfo.branch;

  const pushStatus = gitInfo.pushed
    ? `${colors.green}Pushed ✓${colors.reset}`
    : `${colors.dim}Not pushed${colors.reset}`;

  lines.push(
    `   ${colors.dim}GIT:${colors.reset} ${branchDisplay}  ${pushStatus}`
  );

  // PR URL line (if available)
  if (gitInfo.prUrl) {
    const prLink = hyperlink(gitInfo.prUrl, gitInfo.prUrl);
    lines.push(`   ${colors.dim}PR:${colors.reset} ${prLink}`);
  }

  return lines;
}

/**
 * Build tasks list view content lines
 * Returns array of lines to render in the content area
 */
export function buildTasksListContent(
  state: DevModeState,
  innerWidth: number,
  contentHeight: number
): string[] {
  const lines: string[] = [];
  const { tasks, tasksListState, gitInfo } = state;

  // Header
  lines.push("");
  lines.push(`   ${colors.brightWhite}TASKS${colors.reset}`);
  lines.push(`  ${colors.dim}${"─".repeat(innerWidth - 4)}${colors.reset}`);
  lines.push("");

  // Empty state
  if (tasks.length === 0) {
    const emptyMsg = "Waiting for tasks...";
    const padding = Math.floor((innerWidth - emptyMsg.length) / 2);
    lines.push("");
    lines.push(`${" ".repeat(padding)}${colors.dim}${emptyMsg}${colors.reset}`);
    lines.push("");
  } else {
    // Calculate max description width
    // Format: "  > [1] ✓ description  00:00  0/0"
    // Reserve: 2 (indent) + 2 (selector) + 5 (id) + 2 (icon) + 2 (gap) + 7 (duration) + 2 (gap) + 5 (progress) = ~27
    const maxDescWidth = innerWidth - 30;

    // Task lines
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task) {
        continue;
      }
      const isSelected = i === tasksListState.selectedIndex;
      lines.push(buildTaskLine(task, isSelected, maxDescWidth));

      // Show phases pending hint if no phases
      if (task.phases.length === 0) {
        lines.push(`        ${colors.dim}(phases pending)${colors.reset}`);
      }
    }
  }

  // Separator before git info
  lines.push("");
  lines.push(`  ${colors.dim}${"─".repeat(innerWidth - 4)}${colors.reset}`);

  // Git info
  const gitLines = buildGitInfoLines(gitInfo);
  if (gitLines.length > 0) {
    for (const line of gitLines) {
      lines.push(line);
    }
  } else {
    lines.push(`   ${colors.dim}GIT: (not a git repository)${colors.reset}`);
  }

  lines.push("");

  // Pad to fill content height
  while (lines.length < contentHeight) {
    lines.push("");
  }

  return lines;
}
