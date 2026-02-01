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
 * Get the currently selected session (if any).
 */
function getSelectedSession(state: LauncherState):
  | {
      prUrl?: string;
      branchName?: string;
      status: "active" | "completed" | "failed" | "paused";
    }
  | undefined {
  if (state.selectedIndex === 0) {
    return undefined;
  }
  return state.sessions[state.selectedIndex - 1];
}

/**
 * Check if a session can have a PR created.
 * Session must be completed, have a branch name, and not already have a PR.
 */
function canCreatePr(
  session:
    | {
        prUrl?: string;
        branchName?: string;
        status: "active" | "completed" | "failed" | "paused";
      }
    | undefined
): boolean {
  if (!session) {
    return false;
  }
  return (
    session.status === "completed" &&
    Boolean(session.branchName) &&
    !session.prUrl
  );
}

/**
 * Render the footer with keyboard hints.
 * When a session with a PR URL is selected, shows the PR link.
 */
function renderFooter(state: LauncherState, width: number): string {
  // If PR creation is in progress, show progress footer
  if (state.prCreation) {
    return renderPrCreationFooter(
      state.prCreation.status,
      state.prCreation.error,
      width
    );
  }

  const selectedSession = getSelectedSession(state);

  // If selected session has a PR URL, show special PR footer
  if (state.viewMode === "sessions" && selectedSession?.prUrl) {
    return renderPrFooter(selectedSession.prUrl, width);
  }

  // If selected session can have a PR created, show create PR footer
  if (state.viewMode === "sessions" && canCreatePr(selectedSession)) {
    return renderCreatePrFooter(width);
  }

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
 * Render the footer when a session with a PR URL is selected.
 * Shows the PR URL with an 'o' keybind hint to open it.
 */
function renderPrFooter(prUrl: string, width: number): string {
  const prLabel = `PR: ${colors.brightCyan(prUrl)}`;
  const openHint = hint("o", "open");

  const content = `${prLabel}  ${openHint}`;
  const stripped = stripAnsi(content);
  const padding = Math.max(0, width - stripped.length - 4);

  return `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${content}${pc.cyan(box.horizontal.repeat(Math.max(1, padding)))}${pc.cyan(box.bottomRight)}`;
}

/**
 * Render the footer when a completed session without a PR is selected.
 * Shows the 'o' keybind hint to create a PR.
 */
function renderCreatePrFooter(width: number): string {
  const createHint = hint("o", "create PR");
  const quitHint = hint("^C", "quit");

  const content = `${createHint}  ${quitHint}`;
  const stripped = stripAnsi(content);
  const padding = Math.max(0, width - stripped.length - 4);

  return `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${content}${pc.cyan(box.horizontal.repeat(Math.max(1, padding)))}${pc.cyan(box.bottomRight)}`;
}

/**
 * Render the footer when PR creation is in progress.
 * Shows status message and any error.
 */
function renderPrCreationFooter(
  status: "pushing" | "creating" | "success" | "error",
  error: string | undefined,
  width: number
): string {
  let statusText: string;

  switch (status) {
    case "pushing":
      statusText = `${colors.warning("⟳")} ${colors.muted("Pushing branch...")}`;
      break;
    case "creating":
      statusText = `${colors.warning("⟳")} ${colors.muted("Creating PR...")}`;
      break;
    case "success":
      statusText = `${colors.success("✓")} ${colors.muted("PR created!")}`;
      break;
    default:
      statusText = `${colors.error("✗")} ${colors.error(error || "Error creating PR")}`;
      break;
  }

  const stripped = stripAnsi(statusText);
  const padding = Math.max(0, width - stripped.length - 4);

  return `${pc.cyan(box.bottomLeft)}${pc.cyan(box.horizontal)} ${statusText}${pc.cyan(box.horizontal.repeat(Math.max(1, padding)))}${pc.cyan(box.bottomRight)}`;
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
