import pc from "picocolors";
import type { TUIState, TUITask } from "../../../domain/schemas/tui.js";
import {
  borderedLine,
  box,
  colors,
  emptyBorderedLine,
  formatDuration,
  padRight,
  statusIcon,
  symbols,
  truncate,
} from "./primitives.js";

function renderTaskLine(
  task: TUITask,
  isSelected: boolean,
  width: number
): string {
  const innerWidth = width - 4;
  const parts: string[] = [];

  // Selection indicator
  parts.push(isSelected ? colors.brightMagenta(symbols.arrow) : " ");

  // Task ID
  parts.push(colors.brightMagenta(`[${task.id}]`));

  // Status icon
  parts.push(statusIcon(task.status));

  // Title (truncated)
  const titleMaxLen = innerWidth - 35; // Reserve space for other columns
  const title = truncate(task.title, titleMaxLen);
  parts.push(padRight(title, titleMaxLen));

  // Duration
  if (task.startedAt) {
    const duration = formatDuration(task.startedAt, task.completedAt);
    parts.push(colors.info(duration));
  } else {
    parts.push(colors.muted("--:--"));
  }

  // Phase progress
  const donePhases = task.phases.filter((p) => p.status === "done").length;
  const totalPhases = task.phases.length;
  if (totalPhases > 0) {
    parts.push(colors.muted(`${donePhases}/${totalPhases}`));
  }

  // Criteria progress (as icons)
  if (task.criteria.length > 0) {
    const criteriaIcons = task.criteria
      .map((c) => {
        if (c.status === "passed") {
          return colors.success(symbols.checkmark);
        }
        if (c.status === "failed") {
          return colors.error(symbols.cross);
        }
        return colors.muted(symbols.bulletEmpty);
      })
      .join("");
    parts.push(criteriaIcons);
  }

  return borderedLine(parts.join(" "), width);
}

function renderGitInfo(state: TUIState, width: number): string[] {
  const lines: string[] = [];

  if (state.gitBranch) {
    const pushStatus = state.gitPushed
      ? colors.success(symbols.checkmark)
      : colors.muted("Not pushed");

    lines.push(
      borderedLine(
        `${colors.brand(symbols.diamond)} ${colors.brightWhite("GIT")} ${colors.muted(symbols.separator)} ${colors.brightWhite(state.gitBranch)} ${pushStatus}`,
        width
      )
    );
  }

  if (state.prUrl) {
    // Truncate URL if too long
    const maxUrlLen = width - 15;
    const url = truncate(state.prUrl, maxUrlLen);
    lines.push(
      borderedLine(
        `${colors.brand(symbols.diamond)} ${colors.brightWhite("PR")}  ${colors.muted(symbols.separator)} ${colors.info(url)}`,
        width
      )
    );
  }

  return lines;
}

export function renderTasksListView(
  state: TUIState,
  height: number,
  width: number
): string[] {
  const lines: string[] = [];
  const innerWidth = width - 4;

  // Header
  lines.push(emptyBorderedLine(width));
  const headerText = `${colors.brand(symbols.diamond)} ${colors.brightWhite("TASKS")} ${colors.brand(symbols.diamond)}`;
  lines.push(borderedLine(headerText, width));

  // Separator
  const sepLine = pc.cyan(box.horizontal.repeat(innerWidth));
  lines.push(borderedLine(sepLine, width));
  lines.push(emptyBorderedLine(width));

  // Calculate available height for tasks
  const gitLines = renderGitInfo(state, width);
  const headerHeight = 4; // header lines
  const footerHeight = gitLines.length + 2; // git info + separator + padding
  const availableHeight = height - headerHeight - footerHeight;

  // Tasks
  if (state.tasks.length === 0) {
    const emptyMsg = colors.muted("Waiting for tasks...");
    lines.push(borderedLine(emptyMsg, width));
    for (let i = 1; i < availableHeight; i++) {
      lines.push(emptyBorderedLine(width));
    }
  } else {
    // Render visible tasks
    for (let i = 0; i < availableHeight; i++) {
      const taskIndex = i;
      const task = state.tasks[taskIndex];
      if (task) {
        const isSelected = taskIndex === state.selectedTaskIndex;
        lines.push(renderTaskLine(task, isSelected, width));
      } else {
        lines.push(emptyBorderedLine(width));
      }
    }
  }

  // Bottom separator
  lines.push(emptyBorderedLine(width));
  lines.push(borderedLine(sepLine, width));

  // Git info
  for (const gitLine of gitLines) {
    lines.push(gitLine);
  }

  // Padding to fill height
  while (lines.length < height) {
    lines.push(emptyBorderedLine(width));
  }

  return lines.slice(0, height);
}
