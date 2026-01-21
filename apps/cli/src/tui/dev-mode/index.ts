/**
 * Dev Mode TUI - Full screen terminal interface for Ferix
 * Retro/dev style with bordered layout, header, and footer
 */

import type { Phase, Task } from "../../types/config.js";
import type { DevModeState } from "../../types/tui.js";
import {
  disableRawMode,
  enableRawMode,
} from "../../utils/terminal/raw-mode.js";
import { colors, getTerminalSize, screen } from "../ansi.js";
import { FIXED_ROWS, TOOL_COLORS } from "./layout.js";
import { render } from "./renderer.js";
import { createDevModeState } from "./state.js";

// SGR mouse event regex (for mouse wheel scrolling)
// Format: ESC [ < Cb ; Cx ; Cy M (press) or m (release)
// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC character needed for ANSI parsing
const SGR_MOUSE_REGEX = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/;

export class DevMode {
  private readonly state: DevModeState;
  private scrollOffset = 0;
  private resizeHandler: (() => void) | null = null;
  private keyHandler: ((data: Buffer) => void) | null = null;
  /** True if user has manually scrolled up (disables auto-scroll) */
  private userScrolled = false;

  constructor(task: string, maxIterations: number | string) {
    this.state = createDevModeState(task, maxIterations);
  }

  /**
   * Initialize dev mode - enter alternate buffer, hide cursor, setup handlers
   */
  start(): void {
    screen.alternateBuffer();
    screen.hideCursor();
    screen.enableMouse(); // Capture mouse wheel events
    screen.clear();
    screen.home();

    // Handle terminal resize
    this.resizeHandler = () => this.render();
    process.stdout.on("resize", this.resizeHandler);

    // Setup keyboard input for scrolling
    this.setupKeyboardInput();

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
   * Setup keyboard input handling for scroll
   */
  private setupKeyboardInput(): void {
    enableRawMode();

    this.keyHandler = (data: Buffer) => {
      const key = data.toString();
      this.handleKeypress(key);
    };

    process.stdin.on("data", this.keyHandler);
  }

  /**
   * Handle scroll-related keypresses
   * Returns true if the key was handled as a scroll action
   */
  private handleScrollKey(key: string): boolean {
    const { rows } = getTerminalSize();
    const outputHeight = rows - FIXED_ROWS;

    // Check for SGR mouse events (mouse wheel)
    const mouseMatch = key.match(SGR_MOUSE_REGEX);
    if (mouseMatch?.[1]) {
      const button = Number.parseInt(mouseMatch[1], 10);
      // Button 64 = scroll up, Button 65 = scroll down
      if (button === 64) {
        this.scrollUp(3); // Scroll 3 lines at a time for mouse wheel
      } else if (button === 65) {
        this.scrollDown(outputHeight, 3);
      }
      return true;
    }

    // Up arrow or k
    if (key === "\x1b[A" || key === "k") {
      this.scrollUp();
      return true;
    }
    // Down arrow or j
    if (key === "\x1b[B" || key === "j") {
      this.scrollDown(outputHeight);
      return true;
    }
    // Page up
    if (key === "\x1b[5~") {
      this.scrollUp(outputHeight);
      return true;
    }
    // Page down
    if (key === "\x1b[6~") {
      this.scrollDown(outputHeight, outputHeight);
      return true;
    }
    // Home - scroll to top
    if (key === "g" || key === "\x1b[H") {
      this.scrollToTop();
      return true;
    }
    // End - scroll to bottom (G or End key)
    if (key === "G" || key === "\x1b[F") {
      this.scrollToBottom(outputHeight);
      return true;
    }

    return false;
  }

  /**
   * Handle keypress for scrolling and control
   */
  private handleKeypress(key: string): void {
    // Ctrl+C - exit
    if (key === "\x03") {
      this.cleanup();
      process.exit(0);
    }

    this.handleScrollKey(key);
  }

  /**
   * Scroll up by n lines
   */
  private scrollUp(lines = 1): void {
    if (this.scrollOffset > 0) {
      this.scrollOffset = Math.max(0, this.scrollOffset - lines);
      this.userScrolled = true;
      this.render();
    }
  }

  /**
   * Scroll down by n lines
   */
  private scrollDown(outputHeight: number, lines = 1): void {
    const maxScroll = Math.max(0, this.state.outputLines.length - outputHeight);
    if (this.scrollOffset < maxScroll) {
      this.scrollOffset = Math.min(maxScroll, this.scrollOffset + lines);
      // If we're at the bottom, re-enable auto-scroll
      if (this.scrollOffset >= maxScroll) {
        this.userScrolled = false;
      }
      this.render();
    }
  }

  /**
   * Scroll to the top
   */
  private scrollToTop(): void {
    if (this.scrollOffset > 0) {
      this.scrollOffset = 0;
      this.userScrolled = true;
      this.render();
    }
  }

  /**
   * Scroll to the bottom
   */
  private scrollToBottom(outputHeight: number): void {
    const maxScroll = Math.max(0, this.state.outputLines.length - outputHeight);
    this.scrollOffset = maxScroll;
    this.userScrolled = false;
    this.render();
  }

  /**
   * Cleanup - restore terminal state
   */
  cleanup(): void {
    // Remove keyboard handler
    if (this.keyHandler) {
      process.stdin.removeListener("data", this.keyHandler);
      this.keyHandler = null;
    }
    disableRawMode();

    if (this.resizeHandler) {
      process.stdout.off("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    // Disable mouse tracking and reset scroll region
    screen.disableMouse();
    screen.resetScrollRegion();
    // Clear screen before exiting alternate buffer to avoid artifacts
    screen.clear();
    screen.home();
    screen.showCursor();
    screen.normalBuffer();
    // Force a newline to ensure clean prompt
    process.stdout.write("\n");
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
   * Set phases for a task
   */
  setPhases(taskId: string, phases: Phase[]): void {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (task) {
      task.phases = phases;
      this.render();
    }
  }

  /**
   * Mark a phase as in progress
   */
  setPhaseInProgress(phaseId: string): void {
    for (const task of this.state.tasks) {
      const phase = task.phases.find((p) => p.id === phaseId);
      if (phase) {
        phase.status = "in_progress";
        this.render();
        return;
      }
    }
  }

  /**
   * Mark a phase as done
   */
  markPhaseDone(phaseId: string): void {
    for (const task of this.state.tasks) {
      const phase = task.phases.find((p) => p.id === phaseId);
      if (phase) {
        phase.status = "done";
        // Check if all phases are done - auto-complete task
        const allPhasesDone = task.phases.every((p) => p.status === "done");
        if (allPhasesDone && task.phases.length > 0) {
          task.done = true;
        }
        this.render();
        return;
      }
    }
  }

  /**
   * Mark a phase as failed
   */
  markPhaseFailed(phaseId: string): void {
    for (const task of this.state.tasks) {
      const phase = task.phases.find((p) => p.id === phaseId);
      if (phase) {
        phase.status = "failed";
        this.render();
        return;
      }
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
   * Auto-scroll to keep latest content visible (unless user has scrolled up)
   */
  private autoScroll(): void {
    // Don't auto-scroll if user has manually scrolled up
    if (this.userScrolled) {
      return;
    }

    const { rows } = getTerminalSize();
    const outputHeight = rows - FIXED_ROWS;
    const maxScroll = Math.max(0, this.state.outputLines.length - outputHeight);
    this.scrollOffset = maxScroll;
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
   * Wait for user to press Ctrl+C before exiting
   * Returns a promise that resolves when the user exits
   */
  waitForExit(): Promise<void> {
    return new Promise((resolve) => {
      // Replace the existing key handler with one that only listens for Ctrl+C
      if (this.keyHandler) {
        process.stdin.removeListener("data", this.keyHandler);
      }

      this.keyHandler = (data: Buffer) => {
        const key = data.toString();

        // Ctrl+C - exit
        if (key === "\x03") {
          resolve();
          return;
        }

        // Still allow scrolling while waiting
        this.handleScrollKey(key);
      };

      process.stdin.on("data", this.keyHandler);
    });
  }

  /**
   * Render the full screen
   */
  private render(): void {
    const { rows } = getTerminalSize();
    const outputHeight = rows - FIXED_ROWS;

    render(this.state, {
      offset: this.scrollOffset,
      outputHeight,
      totalLines: this.state.outputLines.length,
      userScrolled: this.userScrolled,
    });
  }
}
