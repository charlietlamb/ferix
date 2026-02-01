import pc from "picocolors";
import {
  borderedLine,
  colors,
  emptyBorderedLine,
  statusText,
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
 * Get status display for a session (muted text).
 */
function getStatusDisplay(status: LauncherSession["status"]): string {
  switch (status) {
    case "active":
      return statusText.active;
    case "completed":
      return statusText.completed;
    case "failed":
      return statusText.failed;
    case "paused":
      return statusText.paused;
    default:
      return statusText.pending;
  }
}

/**
 * Get provider badge for display.
 */
function getProviderBadge(
  provider: LauncherSession["provider"],
  width: number
): string {
  // Skip provider badge for narrow terminals
  if (width < 60) {
    return "";
  }

  if (!provider) {
    return "";
  }

  const badge = `[${provider}]`;
  return colors.muted(badge);
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
 * Render the main row of a session block.
 * Format: "▸ ● session-name                    [provider]  2h ago"
 */
function renderSessionMainRow(
  session: LauncherSession,
  isSelected: boolean,
  width: number
): string {
  const prefix = isSelected ? colors.brand(symbols.arrow) : " ";
  const statusDisplay = getStatusDisplay(session.status);
  const name = session.displayName || truncateTask(session.originalTask);
  const time = formatRelativeTime(session.createdAt);
  const providerBadge = getProviderBadge(session.provider, width);

  // Calculate available width for name
  // Format: "  ▸ [icon] name                [provider]  time"
  const providerWidth = providerBadge ? stripAnsi(providerBadge).length + 2 : 0;
  const fixedWidth = 2 + 1 + 1 + 1 + providerWidth + 2 + stripAnsi(time).length;
  const nameWidth = Math.max(10, width - fixedWidth - 8); // 8 for borders and padding

  const truncatedName = truncate(name, nameWidth);
  const displayName = isSelected ? colors.brand(truncatedName) : truncatedName;
  const paddedName = displayName.padEnd(
    nameWidth + (displayName.length - stripAnsi(displayName).length),
    " "
  );

  const providerPart = providerBadge ? `${providerBadge}  ` : "";
  const content = `${prefix} ${paddedName}  ${statusDisplay}  ${providerPart}${colors.muted(time)}`;
  return borderedLine(content, width);
}

/**
 * Render the detail row of a session block.
 * Format: "   └─ ✓ PR • Last LLM output text truncated..."
 */
function renderSessionDetailRow(
  session: LauncherSession,
  isSelected: boolean,
  width: number
): string {
  // Tree connector with selection-aware coloring
  const connector = isSelected
    ? colors.brand(`   ${symbols.treeLast} `)
    : colors.muted(`   ${symbols.treeLast} `);

  // PR status indicator
  let prIndicator = "";
  if (session.prUrl) {
    // Shorten indicator for narrow terminals
    prIndicator =
      width < 60
        ? `${colors.success(symbols.checkmark)} `
        : `${colors.success(symbols.checkmark)} PR ${colors.muted(symbols.separator)} `;
  }

  // Last output preview
  const lastOutput = session.lastOutput || colors.muted("No output yet");

  // Calculate available width for output preview
  const connectorWidth = stripAnsi(connector).length;
  const prWidth = stripAnsi(prIndicator).length;
  const maxOutputWidth = width - connectorWidth - prWidth - 8; // 8 for borders and padding

  const truncatedOutput =
    stripAnsi(lastOutput).length > maxOutputWidth
      ? truncate(lastOutput, maxOutputWidth)
      : lastOutput;

  const content = `${connector}${prIndicator}${truncatedOutput}`;
  return borderedLine(content, width);
}

/**
 * Render a complete session block (main row + detail row + spacer).
 * Returns an array of lines for this session block.
 */
function renderSessionBlock(
  session: LauncherSession,
  isSelected: boolean,
  width: number
): string[] {
  return [
    renderSessionMainRow(session, isSelected, width),
    renderSessionDetailRow(session, isSelected, width),
    emptyBorderedLine(width), // Spacer line between sessions
  ];
}

/**
 * Render the "Create new session" block (row + spacer).
 */
function renderCreateNewBlock(isSelected: boolean, width: number): string[] {
  const prefix = isSelected ? colors.brand(symbols.arrow) : " ";
  const icon = colors.brightGreen("+");
  const text = "Create new session";
  const content = `${prefix} [${icon}] ${colors.brightWhite(text)}`;

  return [
    borderedLine(content, width),
    emptyBorderedLine(width), // Spacer line after create new
  ];
}

/**
 * Render the sessions list view with multi-row session blocks.
 * Each session takes 3 rows: main row + detail row + spacer.
 * "Create new" takes 2 rows: row + spacer.
 */
export function renderSessionsList(
  state: LauncherState,
  width: number,
  availableHeight: number
): string[] {
  const { scrollOffset, selectedIndex, sessions } = state;

  // Build all rows for all items
  const allRows: string[] = [];

  // "Create new" block (item index 0)
  const createNewRows = renderCreateNewBlock(selectedIndex === 0, width);
  allRows.push(...createNewRows);

  // Session blocks (item indices 1+)
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    if (session) {
      const isSelected = selectedIndex === i + 1;
      const sessionRows = renderSessionBlock(session, isSelected, width);
      allRows.push(...sessionRows);
    }
  }

  // Apply scroll offset and slice to available height
  const visibleRows = allRows.slice(
    scrollOffset,
    scrollOffset + availableHeight
  );

  // Pad with empty lines if we don't have enough content
  while (visibleRows.length < availableHeight) {
    visibleRows.push(emptyBorderedLine(width));
  }

  return visibleRows;
}

/** Visual line representation for multi-line input */
interface VisualLine {
  readonly text: string;
  readonly startIndex: number;
}

/**
 * Split text into visual lines, handling line wrapping.
 */
function splitIntoVisualLines(
  text: string,
  maxLineWidth: number
): VisualLine[] {
  const result: VisualLine[] = [];
  const logicalLines = text.split("\n");
  let currentIndex = 0;

  for (const logicalLine of logicalLines) {
    if (logicalLine.length === 0) {
      result.push({ text: "", startIndex: currentIndex });
      currentIndex++;
    } else if (logicalLine.length <= maxLineWidth) {
      result.push({ text: logicalLine, startIndex: currentIndex });
      currentIndex += logicalLine.length + 1;
    } else {
      let pos = 0;
      while (pos < logicalLine.length) {
        const chunk = logicalLine.slice(pos, pos + maxLineWidth);
        result.push({ text: chunk, startIndex: currentIndex + pos });
        pos += maxLineWidth;
      }
      currentIndex += logicalLine.length + 1;
    }
  }

  return result;
}

/**
 * Find which visual line contains the cursor.
 */
function findCursorLine(
  visualLines: VisualLine[],
  cursorPos: number
): { lineIndex: number; columnInLine: number } {
  for (let i = 0; i < visualLines.length; i++) {
    const vLine = visualLines[i];
    if (!vLine) {
      continue;
    }
    const lineEndIndex = vLine.startIndex + vLine.text.length;
    if (cursorPos <= lineEndIndex) {
      return { lineIndex: i, columnInLine: cursorPos - vLine.startIndex };
    }
  }
  const lastLine = visualLines.at(-1);
  if (lastLine) {
    return {
      lineIndex: visualLines.length - 1,
      columnInLine: cursorPos - lastLine.startIndex,
    };
  }
  return { lineIndex: 0, columnInLine: 0 };
}

/**
 * Render input lines for a visual line array.
 */
function renderInputLines(
  visualLines: VisualLine[],
  cursorLineIndex: number,
  columnInLine: number,
  inputPrefix: string,
  continuationPrefix: string,
  cursor: string,
  width: number
): string[] {
  const result: string[] = [];

  for (let i = 0; i < visualLines.length; i++) {
    const vLine = visualLines[i];
    if (!vLine) {
      continue;
    }

    const prefix = i === 0 ? inputPrefix : continuationPrefix;
    if (i === cursorLineIndex) {
      const beforeCursor = vLine.text.slice(0, columnInLine);
      const afterCursor = vLine.text.slice(columnInLine);
      result.push(
        borderedLine(`${prefix}${beforeCursor}${cursor}${afterCursor}`, width)
      );
    } else {
      result.push(borderedLine(`${prefix}${vLine.text}`, width));
    }
  }

  return result;
}

/**
 * Render the new task input view with multi-line support.
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

  const inputPrefix = `  ${colors.brand(symbols.arrow)} `;
  const continuationPrefix = "    ";
  const prefixWidth = stripAnsi(inputPrefix).length;
  const cursor = pc.inverse(" ");
  const innerWidth = width - 4;
  const maxLineWidth = Math.max(1, innerWidth - prefixWidth);

  const { taskInput, taskInputCursor: cursorPos } = state;

  if (taskInput.length === 0) {
    lines.push(borderedLine(`${inputPrefix}${cursor}`, width));
  } else {
    const visualLines = splitIntoVisualLines(taskInput, maxLineWidth);
    const { lineIndex, columnInLine } = findCursorLine(visualLines, cursorPos);

    const inputLines = renderInputLines(
      visualLines,
      lineIndex,
      columnInLine,
      inputPrefix,
      continuationPrefix,
      cursor,
      width
    );
    lines.push(...inputLines);

    const endsWithNewline = taskInput.at(-1) === "\n";
    if (endsWithNewline && cursorPos === taskInput.length) {
      lines.push(borderedLine(`${continuationPrefix}${cursor}`, width));
    }
  }

  while (lines.length < availableHeight) {
    lines.push(emptyBorderedLine(width));
  }

  return lines.slice(0, availableHeight);
}
