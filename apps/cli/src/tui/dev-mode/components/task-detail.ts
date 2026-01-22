/**
 * Task detail view component for dev mode TUI
 * Shows full details for a selected task including phases, timestamps, and git info
 */

import type { Criterion, Phase, Task } from "../../../types/config.js";
import type { DevModeState, GitInfo } from "../../../types/tui.js";
import { box, colors, hyperlink, symbols } from "../../ansi.js";
import { STATUS_ICONS } from "../layout.js";
import { formatDuration, formatTime } from "../state.js";

/** Criterion status icons */
const CRITERION_ICONS = {
  passed: `${colors.green}✓${colors.reset}`,
  failed: `${colors.red}✗${colors.reset}`,
  pending: `${colors.dim}○${colors.reset}`,
};

/** Status text with colors */
const STATUS_TEXT = {
  done: `${colors.green}Complete${colors.reset}`,
  in_progress: `${colors.yellow}In Progress${colors.reset}`,
  pending: `${colors.dim}Pending${colors.reset}`,
  failed: `${colors.red}Failed${colors.reset}`,
};

/**
 * Get task status text
 */
function getTaskStatusText(task: Task): string {
  if (task.done) {
    return STATUS_TEXT.done;
  }
  const hasInProgress = task.phases.some((p) => p.status === "in_progress");
  if (hasInProgress || task.startedAt) {
    return STATUS_TEXT.in_progress;
  }
  return STATUS_TEXT.pending;
}

/**
 * Get task status icon
 */
function getTaskStatusIcon(task: Task): string {
  if (task.done) {
    return STATUS_ICONS.done;
  }
  const hasInProgress = task.phases.some((p) => p.status === "in_progress");
  if (hasInProgress || task.startedAt) {
    return STATUS_ICONS.in_progress;
  }
  return STATUS_ICONS.pending;
}

/**
 * Build phase lines with tree structure
 */
function buildPhaseLines(phases: Phase[]): string[] {
  const lines: string[] = [];

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (!phase) {
      continue;
    }

    const isLast = i === phases.length - 1;
    const prefix = isLast ? "└─" : "├─";
    const continuePrefix = isLast ? "  " : "│ ";

    const icon = STATUS_ICONS[phase.status];

    // Duration (if started)
    let duration = "";
    if (phase.startedAt && phase.completedAt) {
      duration = formatDuration(phase.startedAt, phase.completedAt);
    } else if (phase.startedAt) {
      duration = formatDuration(phase.startedAt);
    }

    // Main phase line with cyan duration
    const durationDisplay = duration
      ? `  ${colors.cyan}${duration}${colors.reset}`
      : "";
    lines.push(
      `   ${colors.dim}${prefix}${colors.reset} ${icon} ${colors.dim}[${phase.id}]${colors.reset} ${phase.description}${durationDisplay}`
    );

    // Timestamp line (if has timestamps)
    if (phase.startedAt) {
      const startTime = formatTime(phase.startedAt);
      const endTime = phase.completedAt
        ? ` → ${formatTime(phase.completedAt)}`
        : ` → ${colors.dim}...${colors.reset}`;
      lines.push(
        `   ${colors.dim}${continuePrefix}       ${startTime}${endTime}${colors.reset}`
      );
    }
  }

  return lines;
}

/**
 * Build criteria lines with tree structure
 */
function buildCriteriaLines(criteria: Criterion[]): string[] {
  const lines: string[] = [];

  for (let i = 0; i < criteria.length; i++) {
    const criterion = criteria[i];
    if (!criterion) {
      continue;
    }

    const isLast = i === criteria.length - 1;
    const prefix = isLast ? "└─" : "├─";
    const continuePrefix = isLast ? "  " : "│ ";

    const icon = CRITERION_ICONS[criterion.status];

    // Main criterion line (with ID like phases)
    lines.push(
      `   ${colors.dim}${prefix}${colors.reset} ${icon} ${colors.dim}[${criterion.id}]${colors.reset} ${criterion.description}`
    );

    // Failure reason line (if failed) with brightRed arrow
    if (criterion.status === "failed" && criterion.failureReason) {
      lines.push(
        `   ${colors.dim}${continuePrefix}   ${colors.brightRed}↳ ${criterion.failureReason}${colors.reset}`
      );
    }
  }

  return lines;
}

/**
 * Build git info section lines (matches tasks-list styling)
 */
function buildGitInfoLines(gitInfo: GitInfo): string[] {
  const lines: string[] = [];

  if (!gitInfo.branch) {
    return lines;
  }

  // Branch info line with styled components
  const gitLabel = `${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.dim}GIT${colors.reset} ${colors.dim}${box.vertical}${colors.reset}`;
  const branchName = `${colors.brightWhite}${gitInfo.branch}${colors.reset}`;
  const arrow = `${colors.dim}→${colors.reset}`;
  const baseBranch = gitInfo.baseBranch
    ? `${colors.dim}${gitInfo.baseBranch}${colors.reset}`
    : "";

  const branchDisplay = gitInfo.baseBranch
    ? `${branchName} ${arrow} ${baseBranch}`
    : branchName;

  const pushStatus = gitInfo.pushed
    ? `${colors.green}${symbols.checkmark}${colors.reset}`
    : `${colors.dim}Not pushed${colors.reset}`;

  lines.push(`   ${gitLabel} ${branchDisplay}  ${pushStatus}`);

  // PR URL line (if available)
  if (gitInfo.prUrl) {
    const prLabel = `${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.dim}PR${colors.reset} ${colors.dim}${box.vertical}${colors.reset}`;
    const prLink = `${colors.cyan}${hyperlink(gitInfo.prUrl, gitInfo.prUrl)}${colors.reset}`;
    lines.push(`   ${prLabel} ${prLink}`);
  }

  return lines;
}

/** Stage status icons */
const STAGE_ICONS = {
  pending: `${colors.dim}○${colors.reset}`,
  in_progress: `${colors.yellow}●${colors.reset}`,
  passed: `${colors.green}✓${colors.reset}`,
  failed: `${colors.red}✗${colors.reset}`,
};

/** Stage names in order */
const STAGE_ORDER = ["check", "verify", "review"] as const;

/**
 * Calculate stage duration string
 */
function getStageDuration(stage: Task["stages"][keyof Task["stages"]]): string {
  if (!stage) {
    return "--";
  }
  if (stage.startedAt && stage.completedAt) {
    return formatDuration(stage.startedAt, stage.completedAt);
  }
  if (stage.startedAt) {
    return formatDuration(stage.startedAt);
  }
  return "--";
}

/**
 * Build a single stage line
 */
function buildStageLine(
  stageName: (typeof STAGE_ORDER)[number],
  stage: Task["stages"][keyof Task["stages"]],
  prefix: string,
  reviewChanges?: boolean
): string {
  if (!stage || stage.status === "pending") {
    return `   ${colors.dim}${prefix}${colors.reset} ${STAGE_ICONS.pending} ${stageName.toUpperCase().padEnd(7)} ${colors.dim}--${colors.reset}`;
  }

  const icon = STAGE_ICONS[stage.status];
  const attemptText = stage.attempts ? `attempt ${stage.attempts}` : "--";
  const duration = getStageDuration(stage);

  const showChanges = stageName === "review" && stage.status === "passed";
  const extra = showChanges
    ? `  ${colors.dim}(changes: ${reviewChanges ? "yes" : "no"})${colors.reset}`
    : "";

  return `   ${colors.dim}${prefix}${colors.reset} ${icon} ${stageName.toUpperCase().padEnd(7)} ${attemptText}  ${colors.cyan}${duration}${colors.reset}${extra}`;
}

/**
 * Build stages section lines for a task
 */
function buildStagesSection(task: Task, innerWidth: number): string[] {
  const lines: string[] = [];

  lines.push(
    `  ${colors.cyan}${box.doubleHorizontal.repeat(innerWidth - 4)}${colors.reset}`
  );
  lines.push(
    `   ${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}STAGES${colors.reset} ${colors.brightMagenta}${symbols.diamond}${colors.reset}`
  );

  const stages = task.stages ?? {};

  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const stageName = STAGE_ORDER[i];
    if (!stageName) {
      continue;
    }
    const stage = stages[stageName];
    const isLast = i === STAGE_ORDER.length - 1;
    const prefix = isLast ? "└─" : "├─";

    lines.push(buildStageLine(stageName, stage, prefix, task.reviewChanges));
  }

  return lines;
}

/**
 * Build criteria section lines for a task
 */
function buildCriteriaSection(task: Task, innerWidth: number): string[] {
  const lines: string[] = [];

  lines.push(
    `  ${colors.cyan}${box.doubleHorizontal.repeat(innerWidth - 4)}${colors.reset}`
  );

  const attemptsDisplay = task.attempts
    ? ` ${colors.dim}(attempt ${task.attempts})${colors.reset}`
    : "";
  lines.push(
    `   ${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}SUCCESS CRITERIA${colors.reset} ${colors.brightMagenta}${symbols.diamond}${colors.reset}${attemptsDisplay}`
  );

  if (!task.criteria || task.criteria.length === 0) {
    lines.push(`   ${colors.dim}(criteria pending)${colors.reset}`);
    return lines;
  }

  const criteriaLines = buildCriteriaLines(task.criteria);
  for (const line of criteriaLines) {
    lines.push(line);
  }

  return lines;
}

/**
 * Build task detail view content lines
 * Returns array of lines to render in the content area
 */
export function buildTaskDetailContent(
  state: DevModeState,
  innerWidth: number,
  contentHeight: number
): string[] {
  const lines: string[] = [];
  const { tasks, tasksListState, gitInfo } = state;
  const task = tasks[tasksListState.selectedIndex];

  // Handle case where no task is selected
  if (!task) {
    lines.push("");
    const emptyMsg = "No task selected";
    const padding = Math.floor((innerWidth - emptyMsg.length) / 2);
    lines.push(`${" ".repeat(padding)}${colors.dim}${emptyMsg}${colors.reset}`);

    while (lines.length < contentHeight) {
      lines.push("");
    }
    return lines;
  }

  // Task header with diamond styling
  lines.push("");
  lines.push(
    `   ${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}TASK #${task.id}${colors.reset} ${colors.brightMagenta}${symbols.diamond}${colors.reset}`
  );
  lines.push(`   ${task.description}`);
  lines.push(
    `  ${colors.cyan}${box.doubleHorizontal.repeat(innerWidth - 4)}${colors.reset}`
  );

  // Status line with cyan label
  const statusIcon = getTaskStatusIcon(task);
  const statusText = getTaskStatusText(task);
  lines.push(
    `   ${colors.cyan}Status:${colors.reset} ${statusIcon} ${statusText}`
  );

  // Duration line (if started)
  if (task.startedAt) {
    const duration = formatDuration(task.startedAt, task.completedAt);
    lines.push(`   ${colors.dim}Duration:${colors.reset} ${duration}`);

    // Timestamps line
    const startTime = formatTime(task.startedAt);
    const endTime = task.completedAt
      ? formatTime(task.completedAt)
      : `${colors.dim}...${colors.reset}`;
    lines.push(
      `   ${colors.dim}Started:${colors.reset} ${startTime}  ${colors.dim}Completed:${colors.reset} ${endTime}`
    );
  }

  lines.push(
    `  ${colors.cyan}${box.doubleHorizontal.repeat(innerWidth - 4)}${colors.reset}`
  );

  // Phases section with diamond styling
  lines.push(
    `   ${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.brightWhite}PHASES${colors.reset} ${colors.brightMagenta}${symbols.diamond}${colors.reset}`
  );

  if (task.phases.length === 0) {
    lines.push(`   ${colors.dim}(phases pending)${colors.reset}`);
  } else {
    const phaseLines = buildPhaseLines(task.phases);
    for (const line of phaseLines) {
      lines.push(line);
    }
  }

  // Criteria section (if task has criteria)
  const criteriaSectionLines = buildCriteriaSection(task, innerWidth);
  for (const line of criteriaSectionLines) {
    lines.push(line);
  }

  // Stages section (check, verify, review)
  const stagesSectionLines = buildStagesSection(task, innerWidth);
  for (const line of stagesSectionLines) {
    lines.push(line);
  }

  // Separator before git info (cyan double line)
  lines.push(
    `  ${colors.cyan}${box.doubleHorizontal.repeat(innerWidth - 4)}${colors.reset}`
  );

  // Git info
  const gitLines = buildGitInfoLines(gitInfo);
  if (gitLines.length > 0) {
    for (const line of gitLines) {
      lines.push(line);
    }
  } else {
    lines.push(
      `   ${colors.brightMagenta}${symbols.diamond}${colors.reset} ${colors.dim}GIT${colors.reset} ${colors.dim}${box.vertical}${colors.reset} ${colors.dim}(not a git repository)${colors.reset}`
    );
  }

  lines.push("");

  // Pad to fill content height
  while (lines.length < contentHeight) {
    lines.push("");
  }

  return lines;
}
