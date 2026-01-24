import type { TerminalOutput } from "../output.js";
import type { TUIState } from "../state.js";
import { renderFooter } from "./footer.js";
import { renderOutputArea } from "./output-area.js";
import { separator, topBorder } from "./primitives.js";
import { renderStatusBar } from "./status-bar.js";
import { renderTaskBar } from "./task-bar.js";
import { renderTaskDetailView } from "./task-detail.js";
import { renderTasksListView } from "./tasks-list.js";

// Fixed rows: top border + status + task + separator + separator + footer
const FIXED_ROWS = 6;

export function render(state: TUIState, output: TerminalOutput): void {
  const width = output.getWidth();
  const height = output.getHeight();

  // Calculate content area height
  const outputHeight = height - FIXED_ROWS;

  // Move cursor to home
  output.cursorHome();

  // Build all lines
  const lines: string[] = [];

  // Top border
  lines.push(topBorder(width));

  // Status bar
  lines.push(renderStatusBar(state, width));

  // Task bar
  lines.push(renderTaskBar(state.task, width));

  // Separator
  lines.push(separator(width));

  // Content area (based on view mode)
  let contentLines: string[];
  switch (state.viewMode) {
    case "tasks":
      contentLines = renderTasksListView(state, outputHeight, width);
      break;
    case "detail":
      contentLines = renderTaskDetailView(state, outputHeight, width);
      break;
    default:
      contentLines = renderOutputArea(state, outputHeight, width);
      break;
  }

  for (const line of contentLines) {
    lines.push(line);
  }

  // Separator before footer
  lines.push(separator(width));

  // Footer (replaces bottom border)
  lines.push(renderFooter(state, width, outputHeight));

  // Write all lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    output.clearLine();
    if (line !== undefined) {
      output.write(line);
    }
    if (i < lines.length - 1) {
      output.write("\n");
    }
  }
}

export { renderFooter } from "./footer.js";
export { getMaxOutputOffset, renderOutputArea } from "./output-area.js";
export { renderStatusBar } from "./status-bar.js";
export { renderTaskBar } from "./task-bar.js";
export { renderTaskDetailView } from "./task-detail.js";
export { renderTasksListView } from "./tasks-list.js";
