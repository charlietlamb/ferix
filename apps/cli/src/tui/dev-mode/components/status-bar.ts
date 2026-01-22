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
export function getStatus(state: DevModeState): {
  text: string;
  color: string;
} {
  const { status, executionMode, currentTaskId } = state;

  switch (status) {
    case "idle":
      return { text: "IDLE", color: colors.dim };
    case "running": {
      const spinner =
        SPINNER_FRAMES[spinnerState.index % SPINNER_FRAMES.length];
      spinnerState.index++;

      // Show execution mode instead of generic "RUN"
      let modeText: string;
      switch (executionMode) {
        case "breakdown":
          modeText = "BREAKDOWN";
          break;
        case "planning":
          modeText = currentTaskId ? `PLAN #${currentTaskId}` : "PLANNING";
          break;
        case "working":
          modeText = currentTaskId ? `WORK #${currentTaskId}` : "WORKING";
          break;
        case "reviewing":
          modeText = currentTaskId ? `REVIEW #${currentTaskId}` : "REVIEWING";
          break;
        case "verifying":
          modeText = state.verifyAttempt
            ? `VERIFY (${state.verifyAttempt}/3)`
            : "VERIFY";
          break;
        default:
          modeText = "RUN";
      }

      return { text: `${spinner} ${modeText}`, color: colors.brightGreen };
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
  const status = getStatus(state);

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

  // Show current verify command when in verifying mode
  if (state.executionMode === "verifying" && state.currentVerifyCommand) {
    const cmdDisplay =
      state.currentVerifyCommand.length > 30
        ? `${state.currentVerifyCommand.slice(0, 27)}...`
        : state.currentVerifyCommand;
    parts.push(`${colors.yellow}${cmdDisplay}${colors.reset}`);
  }

  return ` ${parts.join(`${colors.dim} | ${colors.reset}`)} `;
}
