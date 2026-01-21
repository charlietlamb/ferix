/**
 * Status bar component for dev mode TUI
 */

import type { DevModeState } from "../../../types/tui.js";
import { colors } from "../../ansi.js";
import { SPINNER_FRAMES, TOOL_COLORS } from "../layout.js";
import { formatElapsed, getTaskProgress, spinnerState } from "../state.js";

/**
 * Get status text with color and spinner
 */
export function getStatus(status: DevModeState["status"]): {
  text: string;
  color: string;
} {
  switch (status) {
    case "idle":
      return { text: "IDLE", color: colors.dim };
    case "running": {
      const spinner =
        SPINNER_FRAMES[spinnerState.index % SPINNER_FRAMES.length];
      spinnerState.index++;
      return { text: `${spinner} RUN`, color: colors.brightGreen };
    }
    case "complete":
      return { text: "DONE", color: colors.brightCyan };
    case "error":
      return { text: "ERR!", color: colors.brightRed };
    default:
      return { text: "???", color: colors.dim };
  }
}

/**
 * Get task status display string
 */
export function getTaskStatusDisplay(state: DevModeState): string {
  const { taskStatus } = state;

  switch (taskStatus) {
    case "analyzing":
      return `${colors.yellow}ANALYZING...${colors.reset}`;
    case "tracking": {
      const { completed, total } = getTaskProgress(state);
      const allDone = completed === total;
      const progressColor = allDone ? colors.brightGreen : colors.brightWhite;
      return `${progressColor}TASK ${completed}${colors.dim}/${total}${colors.reset}`;
    }
    default:
      return "";
  }
}

/**
 * Build status bar content
 */
export function buildStatusBarContent(state: DevModeState): string {
  const { iteration, maxIterations, currentTool, startTime } = state;
  const status = getStatus(state.status);

  const parts = [
    `${colors.brightWhite}FERIX${colors.reset}`,
    `${status.color}${status.text}${colors.reset}`,
    `${colors.brightWhite}${iteration}${colors.dim}/${maxIterations}${colors.reset}`,
    `${colors.dim}${formatElapsed(startTime)}${colors.reset}`,
  ];

  // Add task progress
  const taskDisplay = getTaskStatusDisplay(state);
  if (taskDisplay) {
    parts.push(taskDisplay);
  }

  if (currentTool) {
    const toolColor = TOOL_COLORS[currentTool] || colors.white;
    parts.push(`${toolColor}${currentTool}${colors.reset}`);
  }

  return ` ${parts.join(`${colors.dim} | ${colors.reset}`)} `;
}
