import type { ExecutionMode, TUIState } from "../../../domain/schemas/tui.js";
import {
  borderedLine,
  colors,
  formatDuration,
  getSpinner,
  getToolColor,
  stripAnsi,
  symbols,
  truncate,
} from "./primitives.js";

function getModeDisplay(mode: ExecutionMode, taskId?: string): string {
  const taskSuffix = taskId ? ` #${taskId}` : "";

  switch (mode) {
    case "breakdown":
      return colors.brightMagenta(`BREAKDOWN${taskSuffix}`);
    case "planning":
      return colors.brightCyan(`PLAN${taskSuffix}`);
    case "working":
      return colors.brightGreen(`WORK${taskSuffix}`);
    case "checking":
      return colors.brightYellow(`CHECK${taskSuffix}`);
    case "verifying":
      return colors.warning(`VERIFY${taskSuffix}`);
    case "reviewing":
      return colors.brightMagenta(`REVIEW${taskSuffix}`);
    default:
      return colors.muted("IDLE");
  }
}

export function renderStatusBar(state: TUIState, width: number): string {
  const parts: string[] = [];

  // Brand
  parts.push(
    `${colors.brand(symbols.diamond)} ${colors.brightWhite("FERIX")} ${colors.brand(symbols.diamond)}`
  );

  // YOLO mode indicator (prominent warning)
  if (state.yolo) {
    parts.push(colors.warning("⚠ YOLO"));
  }

  // Debug mode indicator
  if (state.debug) {
    parts.push(colors.brightMagenta("DEBUG"));
  }

  // Provider/agent indicator
  const providerLabels: Record<string, string> = {
    claude: "CLAUDE",
    cursor: "CURSOR",
    opencode: "OPENCODE",
  };
  const providerLabel =
    providerLabels[state.provider] ?? state.provider.toUpperCase();
  parts.push(colors.brightCyan(providerLabel));

  // Spinner + Mode (only when running)
  if (state.status === "running") {
    const spinner = getSpinner();
    const mode = getModeDisplay(state.executionMode, state.currentTaskId);
    parts.push(`${spinner} ${mode}`);
  } else if (state.status === "complete") {
    parts.push(colors.brightCyan("COMPLETE"));
  } else if (state.status === "error") {
    parts.push(colors.brightRed("ERROR"));
  }

  // Iteration
  const iterDisplay =
    state.maxIterations > 0
      ? `${state.iteration}/${state.maxIterations}`
      : `${state.iteration}`;
  parts.push(iterDisplay);

  // Elapsed time
  if (state.startTime) {
    parts.push(colors.info(formatDuration(state.startTime)));
  }

  // Task progress
  if (state.tasks.length > 0) {
    const completed = state.tasks.filter((t) => t.status === "done").length;
    const total = state.tasks.length;
    const allDone = completed === total;
    const taskProgress = `TASK ${completed}/${total}`;
    parts.push(allDone ? colors.brightGreen(taskProgress) : taskProgress);
  }

  // Current tool
  if (state.currentTool) {
    const colorFn = getToolColor(state.currentTool);
    parts.push(colorFn(`[${state.currentTool}]`));
  }

  // Join with separators
  const content = parts.join(` ${colors.muted(symbols.separator)} `);

  // Truncate if too long
  const maxContentWidth = width - 4;
  const truncated =
    stripAnsi(content).length > maxContentWidth
      ? truncate(content, maxContentWidth)
      : content;

  return borderedLine(truncated, width);
}
