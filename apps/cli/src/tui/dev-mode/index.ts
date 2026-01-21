/**
 * Dev Mode TUI - Full screen terminal interface for Ferix
 * Retro/dev style with bordered layout, header, and footer
 */

import type { Task } from "../../types/config.js";
import type { DevModeState } from "../../types/tui.js";
import { colors, getTerminalSize, screen } from "../ansi.js";
import { calculateScrollOffset } from "./components/output-area.js";
import { FIXED_ROWS, TOOL_COLORS } from "./layout.js";
import { render } from "./renderer.js";
import { createDevModeState } from "./state.js";

export class DevMode {
  private readonly state: DevModeState;
  private scrollOffset = 0;
  private resizeHandler: (() => void) | null = null;
  private isWaitingForExit = false;

  constructor(task: string, maxIterations: number | string) {
    this.state = createDevModeState(task, maxIterations);
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
    this.scrollOffset = calculateScrollOffset(
      this.state.outputLines,
      outputHeight,
      this.scrollOffset
    );
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
   * Render the full screen
   */
  private render(): void {
    render(this.state, this.scrollOffset, this.isWaitingForExit);
  }
}
