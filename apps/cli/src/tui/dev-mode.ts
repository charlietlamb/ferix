/**
 * Dev Mode TUI - Full screen terminal interface for Ferix
 * Retro/dev style with bordered layout, header, and footer
 */

import type { Task } from "../types.js";
import {
  box,
  colors,
  getTerminalSize,
  screen,
  stripAnsi,
  truncate,
} from "./ansi.js";

/** Task tracking status */
export type TaskStatus = "analyzing" | "tracking" | "none";

export interface DevModeState {
  task: string;
  iteration: number;
  maxIterations: number | string;
  status: "idle" | "running" | "complete" | "error";
  currentTool?: string;
  outputLines: string[];
  startTime: number;
  /** Task tracking state */
  taskStatus: TaskStatus;
  /** Extracted tasks from the work */
  tasks: Task[];
}

// Layout: rows used by non-output content
// Top border (1) + status (1) + task (1) + separator (1) = 4 header rows
// Separator (1) + footer (1) + bottom border (1) = 3 footer rows
// Total fixed = 7 rows
const FIXED_ROWS = 7;

// Spinner frames for activity indicator
const SPINNER_FRAMES = ["|", "/", "-", "\\"];
const spinnerState = { index: 0 };

// Tool colors for retro dev aesthetic
const TOOL_COLORS: Record<string, string> = {
  Read: colors.cyan,
  Edit: colors.yellow,
  Write: colors.green,
  Bash: colors.magenta,
  Glob: colors.blue,
  Grep: colors.blue,
  Task: colors.brightWhite,
  WebFetch: colors.cyan,
  WebSearch: colors.blue,
  TodoWrite: colors.green,
};

export class DevMode {
  private readonly state: DevModeState;
  private scrollOffset = 0;
  private resizeHandler: (() => void) | null = null;
  private isWaitingForExit = false;

  constructor(task: string, maxIterations: number | string) {
    this.state = {
      task,
      iteration: 0,
      maxIterations,
      status: "idle",
      outputLines: [],
      startTime: Date.now(),
      taskStatus: "analyzing",
      tasks: [],
    };
  }

  /**
   * Initialize dev mode - enter alternate buffer, hide cursor, setup handlers
   */
  start(): void {
    screen.alternateBuffer();
    screen.hideCursor();
    screen.clear();
    screen.home();

    // Handle terminal resize
    this.resizeHandler = () => this.render();
    process.stdout.on("resize", this.resizeHandler);

    // Ensure cleanup on unexpected exit
    const cleanupOnExit = () => {
      this.cleanup();
      process.exit(0);
    };
    process.once("SIGINT", cleanupOnExit);
    process.once("SIGTERM", cleanupOnExit);

    this.render();
  }

  /**
   * Cleanup - restore terminal state
   */
  cleanup(): void {
    if (this.resizeHandler) {
      process.stdout.off("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    // Clear screen before exiting alternate buffer to avoid artifacts
    screen.clear();
    screen.home();
    screen.showCursor();
    screen.normalBuffer();
    // Force a newline to ensure clean prompt
    process.stdout.write("\n");
  }

  /**
   * Wait for user to press a key before exiting
   */
  waitForExit(): Promise<void> {
    this.isWaitingForExit = true;
    this.render();

    return new Promise((resolve) => {
      const onKeypress = () => {
        process.stdin.removeListener("data", onKeypress);
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        resolve();
      };

      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.once("data", onKeypress);
    });
  }

  /**
   * Update iteration
   */
  setIteration(iteration: number): void {
    this.state.iteration = iteration;
    this.state.status = "running";
    this.render();
  }

  /**
   * Set current tool being used
   */
  setTool(tool: string | undefined): void {
    this.state.currentTool = tool;
    this.render();
  }

  /**
   * Set the extracted tasks
   */
  setTasks(tasks: Task[]): void {
    this.state.tasks = tasks;
    this.state.taskStatus = "tracking";
    this.render();
  }

  /**
   * Mark a task as completed
   */
  markTaskDone(taskId: string): void {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (task) {
      task.done = true;
      this.render();
    }
  }

  /**
   * Get task progress string (e.g., "2/5")
   */
  private getTaskProgress(): { completed: number; total: number } {
    const completed = this.state.tasks.filter((t) => t.done).length;
    return { completed, total: this.state.tasks.length };
  }

  /**
   * Add output text (streaming)
   */
  addOutput(text: string): void {
    // Handle the text character by character to properly track newlines
    for (const char of text) {
      if (char === "\n") {
        // Start a new line
        this.state.outputLines.push("");
      } else {
        // Append to current line (create first line if needed)
        if (this.state.outputLines.length === 0) {
          this.state.outputLines.push("");
        }
        const lastIdx = this.state.outputLines.length - 1;
        this.state.outputLines[lastIdx] += char;
      }
    }

    this.autoScroll();
    this.render();
  }

  /**
   * Add a tool use indicator with color (on its own line)
   */
  addToolUse(tool: string, detail: string): void {
    const color = TOOL_COLORS[tool] || colors.dim;
    // Always add on a new line
    this.state.outputLines.push(
      `${color}>> ${tool}${colors.reset} ${colors.dim}${detail}${colors.reset}`
    );
    // Add empty line after so next text starts fresh
    this.state.outputLines.push("");
    this.autoScroll();
    this.render();
  }

  /**
   * Auto-scroll to keep latest content visible
   */
  private autoScroll(): void {
    const { rows } = getTerminalSize();
    const outputHeight = rows - FIXED_ROWS;
    if (this.state.outputLines.length > outputHeight) {
      this.scrollOffset = this.state.outputLines.length - outputHeight;
    }
  }

  /**
   * Set status to complete
   */
  setComplete(): void {
    this.state.status = "complete";
    this.render();
  }

  /**
   * Set status to error
   */
  setError(): void {
    this.state.status = "error";
    this.render();
  }

  /**
   * Format elapsed time
   */
  private formatElapsed(): string {
    const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Get status text with color and spinner
   */
  private getStatus(): { text: string; color: string } {
    switch (this.state.status) {
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
   * Render the full screen with borders
   */
  render(): void {
    const { rows, cols } = getTerminalSize();
    const innerWidth = cols - 2;
    const outputHeight = rows - FIXED_ROWS;

    screen.home();

    // Row 1: Top border
    this.writeLine(
      `${colors.cyan}${box.topLeft}${box.horizontal.repeat(innerWidth)}${box.topRight}${colors.reset}`
    );

    // Row 2: Status bar
    this.renderStatusBar(innerWidth);

    // Row 3: Task
    this.renderTaskBar(innerWidth);

    // Row 4: Header/content separator
    this.writeLine(
      `${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
    );

    // Rows 5 to (rows-3): Output area
    this.renderOutput(outputHeight, innerWidth);

    // Row (rows-2): Content/footer separator
    this.writeLine(
      `${colors.cyan}${box.teeRight}${box.horizontal.repeat(innerWidth)}${box.teeLeft}${colors.reset}`
    );

    // Row (rows-1): Footer
    this.renderFooter(innerWidth);

    // Row (rows): Bottom border (no newline at end)
    process.stdout.write(
      `${colors.cyan}${box.bottomLeft}${box.horizontal.repeat(innerWidth)}${box.bottomRight}${colors.reset}`
    );
  }

  /**
   * Write a line and move to next
   */
  private writeLine(content: string): void {
    process.stdout.write(`${content}\n`);
  }

  /**
   * Render a bordered line with content
   */
  private borderedLine(content: string, innerWidth: number): void {
    const contentLen = stripAnsi(content).length;
    const padding = Math.max(0, innerWidth - contentLen);
    this.writeLine(
      `${colors.cyan}${box.vertical}${colors.reset}${content}${" ".repeat(padding)}${colors.cyan}${box.vertical}${colors.reset}`
    );
  }

  /**
   * Get task status display
   */
  private getTaskStatusDisplay(): string {
    const { taskStatus } = this.state;

    switch (taskStatus) {
      case "analyzing":
        return `${colors.yellow}ANALYZING...${colors.reset}`;
      case "tracking": {
        const { completed, total } = this.getTaskProgress();
        const allDone = completed === total;
        const progressColor = allDone ? colors.brightGreen : colors.brightWhite;
        return `${progressColor}TASK ${completed}${colors.dim}/${total}${colors.reset}`;
      }
      default:
        return "";
    }
  }

  /**
   * Render status bar
   */
  private renderStatusBar(innerWidth: number): void {
    const { iteration, maxIterations, currentTool } = this.state;
    const status = this.getStatus();

    const parts = [
      `${colors.brightWhite}FERIX${colors.reset}`,
      `${status.color}${status.text}${colors.reset}`,
      `${colors.brightWhite}${iteration}${colors.dim}/${maxIterations}${colors.reset}`,
      `${colors.dim}${this.formatElapsed()}${colors.reset}`,
    ];

    // Add task progress
    const taskDisplay = this.getTaskStatusDisplay();
    if (taskDisplay) {
      parts.push(taskDisplay);
    }

    if (currentTool) {
      const toolColor = TOOL_COLORS[currentTool] || colors.white;
      parts.push(`${toolColor}${currentTool}${colors.reset}`);
    }

    const content = ` ${parts.join(`${colors.dim} | ${colors.reset}`)} `;
    this.borderedLine(content, innerWidth);
  }

  /**
   * Render task bar
   */
  private renderTaskBar(innerWidth: number): void {
    const { task } = this.state;
    const label = `${colors.dim}TASK:${colors.reset}`;
    const taskText = truncate(task, innerWidth - 8);
    const content = ` ${label} ${taskText} `;
    this.borderedLine(content, innerWidth);
  }

  /**
   * Render scrolling output area
   */
  private renderOutput(height: number, innerWidth: number): void {
    const { outputLines } = this.state;
    const visibleLines = outputLines.slice(
      this.scrollOffset,
      this.scrollOffset + height
    );

    for (let i = 0; i < height; i++) {
      const line = visibleLines[i] ?? "";
      const displayLine = ` ${truncate(line, innerWidth - 2)} `;
      this.borderedLine(displayLine, innerWidth);
    }
  }

  /**
   * Render footer
   */
  private renderFooter(innerWidth: number): void {
    let content: string;

    if (this.isWaitingForExit) {
      content = ` ${colors.brightWhite}>> Press any key to exit${colors.reset} `;
    } else {
      const parts = [`${colors.dim}^C${colors.reset} quit`];

      if (this.state.outputLines.length > 0) {
        parts.push(
          `${colors.dim}L:${colors.reset}${this.state.outputLines.length}`
        );
      }

      content = ` ${parts.join("  ")} `;
    }

    this.borderedLine(content, innerWidth);
  }
}
