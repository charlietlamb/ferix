import pc from "picocolors";
import type {
  TUICriterion,
  TUIPhase,
  TUIState,
} from "../../../domain/schemas/tui.js";
import {
  borderedLine,
  box,
  colors,
  emptyBorderedLine,
  formatDuration,
  formatTime,
  statusIcon,
  symbols,
} from "./primitives.js";

function renderPhase(
  phase: TUIPhase,
  isLast: boolean,
  width: number
): string[] {
  const lines: string[] = [];
  const prefix = isLast ? symbols.treeLast : symbols.treeMiddle;
  const icon = statusIcon(phase.status);

  // Phase line
  const phaseText = `   ${colors.muted(prefix)} ${icon} ${colors.muted(`[${phase.id}]`)} ${phase.description}`;

  // Add duration if available
  if (phase.startedAt) {
    const duration = formatDuration(phase.startedAt, phase.completedAt);
    lines.push(borderedLine(`${phaseText}  ${colors.info(duration)}`, width));

    // Add timestamps
    const vertPrefix = isLast ? "    " : symbols.treeVertical;
    const startTime = formatTime(phase.startedAt);
    const endTime = phase.completedAt ? formatTime(phase.completedAt) : "...";
    lines.push(
      borderedLine(
        `   ${vertPrefix}     ${colors.muted(`${startTime} → ${endTime}`)}`,
        width
      )
    );
  } else {
    lines.push(borderedLine(`${phaseText}  ${colors.muted("--")}`, width));
  }

  return lines;
}

function renderCriterion(
  criterion: TUICriterion,
  isLast: boolean,
  width: number
): string[] {
  const lines: string[] = [];
  const prefix = isLast ? symbols.treeLast : symbols.treeMiddle;
  const icon = statusIcon(criterion.status);

  lines.push(
    borderedLine(
      `   ${colors.muted(prefix)} ${icon} ${colors.muted(`[${criterion.id}]`)} ${criterion.description}`,
      width
    )
  );

  // Show failure reason if failed
  if (criterion.status === "failed" && criterion.failureReason) {
    const vertPrefix = isLast ? "    " : symbols.treeVertical;
    lines.push(
      borderedLine(
        `   ${vertPrefix}     ${colors.error(`↳ ${criterion.failureReason}`)}`,
        width
      )
    );
  }

  return lines;
}

function getStatusText(status: string): string {
  switch (status) {
    case "done":
      return colors.success("Done");
    case "in_progress":
      return colors.warning("In Progress");
    case "failed":
      return colors.error("Failed");
    default:
      return colors.muted("Pending");
  }
}

function renderEmptyState(height: number, width: number): string[] {
  const lines: string[] = [];
  lines.push(borderedLine(colors.muted("No task selected"), width));
  while (lines.length < height) {
    lines.push(emptyBorderedLine(width));
  }
  return lines;
}

function renderTaskHeader(
  task: { id: string; title: string },
  width: number,
  innerWidth: number
): string[] {
  const sepLine = pc.cyan(box.horizontal.repeat(innerWidth));
  return [
    emptyBorderedLine(width),
    borderedLine(
      `${colors.brand(symbols.diamond)} ${colors.brightWhite(`TASK #${task.id}`)} ${colors.brand(symbols.diamond)}`,
      width
    ),
    borderedLine(task.title, width),
    emptyBorderedLine(width),
    borderedLine(sepLine, width),
    emptyBorderedLine(width),
  ];
}

function renderTaskStatus(
  task: {
    status: string;
    startedAt?: number;
    completedAt?: number;
  },
  width: number
): string[] {
  const lines: string[] = [];
  const statusText = `${colors.brightWhite("Status:")} ${statusIcon(task.status as "pending" | "in_progress" | "done" | "failed")} ${getStatusText(task.status)}`;
  lines.push(borderedLine(statusText, width));

  if (task.startedAt) {
    const duration = formatDuration(task.startedAt, task.completedAt);
    const startTime = formatTime(task.startedAt);
    const endTime = task.completedAt ? formatTime(task.completedAt) : "...";
    lines.push(
      borderedLine(
        `${colors.brightWhite("Duration:")} ${colors.info(duration)} (${colors.muted(`${startTime} → ${endTime}`)})`,
        width
      )
    );
  }

  lines.push(emptyBorderedLine(width));
  return lines;
}

function renderPhasesSection(
  phases: readonly TUIPhase[],
  width: number
): string[] {
  if (phases.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push(borderedLine(colors.brightWhite("Phases:"), width));

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (!phase) {
      continue;
    }
    const phaseLines = renderPhase(phase, i === phases.length - 1, width);
    lines.push(...phaseLines);
  }

  lines.push(emptyBorderedLine(width));
  return lines;
}

function renderCriteriaSection(
  criteria: readonly TUICriterion[],
  width: number
): string[] {
  if (criteria.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push(borderedLine(colors.brightWhite("Criteria:"), width));

  for (let i = 0; i < criteria.length; i++) {
    const criterion = criteria[i];
    if (!criterion) {
      continue;
    }
    const criterionLines = renderCriterion(
      criterion,
      i === criteria.length - 1,
      width
    );
    lines.push(...criterionLines);
  }

  lines.push(emptyBorderedLine(width));
  return lines;
}

function renderGitSection(
  state: TUIState,
  width: number,
  innerWidth: number
): string[] {
  if (!state.gitBranch) {
    return [];
  }

  const lines: string[] = [];
  const sepLine = pc.cyan(box.horizontal.repeat(innerWidth));
  const pushStatus = state.gitPushed
    ? colors.success(symbols.checkmark)
    : colors.muted("Not pushed");

  lines.push(borderedLine(sepLine, width));
  lines.push(
    borderedLine(
      `${colors.brand(symbols.diamond)} ${colors.brightWhite("GIT")} ${colors.muted(symbols.separator)} ${state.gitBranch} ${pushStatus}`,
      width
    )
  );

  if (state.prUrl) {
    lines.push(
      borderedLine(
        `${colors.brand(symbols.diamond)} ${colors.brightWhite("PR")}  ${colors.muted(symbols.separator)} ${colors.info(state.prUrl)}`,
        width
      )
    );
  }

  return lines;
}

function padToHeight(lines: string[], height: number, width: number): string[] {
  const result = [...lines];
  while (result.length < height) {
    result.push(emptyBorderedLine(width));
  }
  return result.slice(0, height);
}

export function renderTaskDetailView(
  state: TUIState,
  height: number,
  width: number
): string[] {
  const innerWidth = width - 4;
  const task = state.tasks[state.selectedTaskIndex];

  if (!task) {
    return renderEmptyState(height, width);
  }

  const lines: string[] = [
    ...renderTaskHeader(task, width, innerWidth),
    ...renderTaskStatus(task, width),
    ...renderPhasesSection(task.phases, width),
    ...renderCriteriaSection(task.criteria, width),
    ...renderGitSection(state, width, innerWidth),
  ];

  return padToHeight(lines, height, width);
}
