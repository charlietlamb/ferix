import pc from "picocolors";
import type { TerminalOutput } from "../../tui/output/index.js";
import {
  borderedLine,
  box,
  colors,
  separator,
  stripAnsi,
  symbols,
  topBorder,
} from "../../tui/render/primitives.js";
import type { LauncherState } from "../state.js";
import { renderNewTaskInput, renderSessionsList } from "./sessions-list.js";

/** Fixed rows: header (3) + separator + footer (1) */
const FIXED_ROWS = 5;

/**
 * Create a hint string for the footer.
 */
function hint(key: string, description: string): string {
  return `${colors.brand(symbols.diamond)} ${colors.brightWhite(key)} ${colors.muted(description)}`;
}

/**
 * Render the header.
 */
function renderHeader(state: LauncherState, width: number): string[] {
  const lines: string[] = [];
  lines.push(topBorder(width));

  const title =
    state.viewMode === "new_task_input"
      ? `  ${colors.brand(symbols.diamond)} ${colors.brightMagenta("NEW SESSION")} ${colors.brand(symbols.diamond)}`
      : `  ${colors.brand(symbols.diamond)} ${colors.brightMagenta("FERIX")} ${colors.brand(symbols.diamond)}`;

  lines.push(borderedLine(title, width));
  lines.push(separator(width));

  return lines;
}

/**
 * Render daemon status indicator for the footer.
 */
function renderDaemonStatus(state: LauncherState): string {
  const { daemon } = state;

  if (!daemon.running) {
    return `${colors.muted(symbols.bulletEmpty)} ${colors.muted("Daemon stopped")}`;
  }

  const pidText = daemon.pid ? `PID ${daemon.pid}` : "";
  const activeText =
    daemon.activeSessions > 0
      ? ` ${colors.muted("•")} ${daemon.activeSessions} active`
      : "";

  return `${colors.success(symbols.bulletFilled)} ${colors.muted("Daemon")} ${colors.muted(`(${pidText})`)}${activeText}`;
}

/**
 * Render the footer with keyboard hints.
 */
function renderFooter(state: LauncherState, width: number): string {
  const hints: string[] = [];

  if (state.viewMode === "sessions") {
    hints.push(hint("j/k", "navigate"));
    hints.push(hint("Enter", "select"));
    hints.push(hint("n", "new"));
    if (state.daemon.running) {
      hints.push(hint("d", "stop daemon"));
    }
    hints.push(hint("^C", "quit"));
  } else {
    hints.push(hint("Enter", "confirm"));
    hints.push(hint("Esc", "cancel"));
  }

  // Build content with daemon status on left, hints on right
  const daemonStatus = renderDaemonStatus(state);
  const hintsContent = hints.join("  ");

  const content = `${daemonStatus}   ${hintsContent}`;
  const stripped = stripAnsi(content);
  const padding = Math.max(0, width - stripped.length - 4);

  return `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${content}${pc.cyan(box.horizontal.repeat(Math.max(1, padding)))}${pc.cyan(box.bottomRight)}`;
}

/**
 * Render the loading state.
 */
function renderLoading(width: number, height: number): string[] {
  const lines: string[] = [];
  lines.push(topBorder(width));
  lines.push(
    borderedLine(
      `  ${colors.brand(symbols.diamond)} ${colors.brightMagenta("FERIX")} ${colors.brand(symbols.diamond)}`,
      width
    )
  );
  lines.push(separator(width));

  const loadingMsg = borderedLine(
    `  ${colors.muted("Loading sessions...")}`,
    width
  );
  const emptyLine = borderedLine("", width);

  // Fill content area
  const contentHeight = height - FIXED_ROWS;
  for (let i = 0; i < contentHeight; i++) {
    lines.push(i === 1 ? loadingMsg : emptyLine);
  }

  // Footer
  const footer = `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${hint("^C", "quit")}${pc.cyan(box.horizontal.repeat(Math.max(1, width - 15)))}${pc.cyan(box.bottomRight)}`;
  lines.push(footer);

  return lines;
}

/**
 * Render error state.
 */
function renderError(error: string, width: number, height: number): string[] {
  const lines: string[] = [];
  lines.push(topBorder(width));
  lines.push(
    borderedLine(
      `  ${colors.brand(symbols.diamond)} ${colors.brightMagenta("FERIX")} ${colors.brand(symbols.diamond)}`,
      width
    )
  );
  lines.push(separator(width));

  const errorMsg = borderedLine(`  ${colors.error(`Error: ${error}`)}`, width);
  const emptyLine = borderedLine("", width);

  const contentHeight = height - FIXED_ROWS;
  for (let i = 0; i < contentHeight; i++) {
    lines.push(i === 1 ? errorMsg : emptyLine);
  }

  const footer = `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${hint("^C", "quit")}${pc.cyan(box.horizontal.repeat(Math.max(1, width - 15)))}${pc.cyan(box.bottomRight)}`;
  lines.push(footer);

  return lines;
}

/**
 * Render the full launcher screen.
 */
export function render(state: LauncherState, output: TerminalOutput): void {
  const width = output.getWidth();
  const height = output.getHeight();

  let lines: string[];

  if (state.isLoading) {
    lines = renderLoading(width, height);
  } else if (state.error) {
    lines = renderError(state.error, width, height);
  } else {
    const headerLines = renderHeader(state, width);
    const contentHeight = height - FIXED_ROWS;

    const contentLines =
      state.viewMode === "sessions"
        ? renderSessionsList(state, width, contentHeight)
        : renderNewTaskInput(state, width, contentHeight);

    const footer = renderFooter(state, width);

    lines = [...headerLines, ...contentLines, footer];
  }

  // Clear and render
  output.cursorHome();
  for (const line of lines) {
    output.writeLine(line);
  }
}
