import pc from "picocolors";
import type { DomainEvent } from "../../domain/events.js";
import { ANSIOutput, type TerminalOutput } from "./output.js";

/**
 * Box drawing characters for TUI borders.
 */
const BOX = {
  TOP_LEFT: "╔",
  TOP_RIGHT: "╗",
  BOTTOM_LEFT: "╚",
  BOTTOM_RIGHT: "╝",
  HORIZONTAL: "═",
  VERTICAL: "║",
  T_DOWN: "╦",
  T_UP: "╩",
  T_RIGHT: "╠",
  T_LEFT: "╣",
  CROSS: "╬",
} as const;

/** ANSI escape code pattern for stripping color codes */
// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for ANSI escape code detection
const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

/** No-op event handler for unhandled event types */
function noop(): void {
  // Intentionally empty - handles unrecognized event types
}

/**
 * State tracked by the renderer.
 */
interface RendererState {
  task: string;
  iteration: number;
  maxIterations: number;
  currentPhase?: string;
  currentTool?: string;
  outputLines: string[];
  tasks: Array<{ id: string; title: string; done: boolean }>;
  phases: Array<{ id: string; description: string; status: string }>;
}

/**
 * TUI renderer for displaying domain events in a terminal.
 *
 * Uses an abstracted TerminalOutput interface for actual output,
 * allowing for testing and alternative backends.
 *
 * Sections:
 * - Header (task and iteration info)
 * - Tasks list
 * - Current phase and tool
 * - Scrollable output area
 */
export class TUIRenderer {
  private readonly state: RendererState;
  private readonly output: TerminalOutput;
  private readonly unsubscribeResize?: () => void;

  /**
   * Creates a new TUI renderer.
   *
   * @param output - Optional TerminalOutput implementation. Defaults to ANSIOutput.
   */
  constructor(output?: TerminalOutput) {
    this.output = output ?? new ANSIOutput();
    this.state = {
      task: "",
      iteration: 0,
      maxIterations: 0,
      outputLines: [],
      tasks: [],
      phases: [],
    };

    // Subscribe to resize events
    this.unsubscribeResize = this.output.onResize(() => {
      this.draw();
    });
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.unsubscribeResize?.();
  }

  /**
   * Enter alternate buffer and hide cursor.
   */
  enterAlternateBuffer(): void {
    this.output.enterAlternateBuffer();
    this.output.hideCursor();
    this.output.clearScreen();
  }

  /**
   * Exit alternate buffer and show cursor.
   */
  exitAlternateBuffer(): void {
    this.output.showCursor();
    this.output.exitAlternateBuffer();
  }

  /**
   * Hide the cursor.
   */
  hideCursor(): void {
    this.output.hideCursor();
  }

  /**
   * Show the cursor.
   */
  showCursor(): void {
    this.output.showCursor();
  }

  /**
   * Render a domain event to the terminal.
   */
  render(event: DomainEvent): void {
    this.updateState(event);
    this.draw();
  }

  /**
   * Update internal state based on event.
   */
  private updateState(event: DomainEvent): void {
    const handler = this.getEventHandler(event._tag);
    handler(event);
  }

  /**
   * Get the appropriate handler for an event type.
   */
  private getEventHandler(
    tag: DomainEvent["_tag"]
  ): (event: DomainEvent) => void {
    const handlers: Partial<
      Record<DomainEvent["_tag"], (event: DomainEvent) => void>
    > = {
      LoopStarted: (e) => this.handleLoopStarted(e),
      IterationStarted: (e) => this.handleIterationStarted(e),
      LLMText: (e) => this.handleLLMText(e),
      LLMToolStart: (e) => this.handleLLMToolStart(e),
      LLMToolEnd: () => this.handleLLMToolEnd(),
      TasksDefined: (e) => this.handleTasksDefined(e),
      PhasesDefined: (e) => this.handlePhasesDefined(e),
      PhaseStarted: (e) => this.handlePhaseStarted(e),
      PhaseCompleted: (e) => this.handlePhaseCompleted(e),
      TaskCompleted: (e) => this.handleTaskCompleted(e),
    };

    return handlers[tag] || noop;
  }

  private handleLoopStarted(event: DomainEvent): void {
    if (event._tag !== "LoopStarted") {
      return;
    }
    this.state.task = event.config.task;
    this.state.maxIterations = event.config.maxIterations;
  }

  private handleIterationStarted(event: DomainEvent): void {
    if (event._tag !== "IterationStarted") {
      return;
    }
    this.state.iteration = event.iteration;
  }

  private handleLLMText(event: DomainEvent): void {
    if (event._tag !== "LLMText" || !event.text) {
      return;
    }
    const lines = event.text.split("\n");
    for (const line of lines) {
      if (line) {
        this.state.outputLines.push(line);
      }
    }
    while (this.state.outputLines.length > 1000) {
      this.state.outputLines.shift();
    }
  }

  private handleLLMToolStart(event: DomainEvent): void {
    if (event._tag !== "LLMToolStart") {
      return;
    }
    this.state.currentTool = event.tool;
  }

  private handleLLMToolEnd(): void {
    this.state.currentTool = undefined;
  }

  private handleTasksDefined(event: DomainEvent): void {
    if (event._tag !== "TasksDefined") {
      return;
    }
    this.state.tasks = event.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      done: false,
    }));
  }

  private handlePhasesDefined(event: DomainEvent): void {
    if (event._tag !== "PhasesDefined") {
      return;
    }
    this.state.phases = event.phases.map((p) => ({
      id: p.id,
      description: p.description,
      status: "pending",
    }));
  }

  private handlePhaseStarted(event: DomainEvent): void {
    if (event._tag !== "PhaseStarted") {
      return;
    }
    this.state.currentPhase = event.phaseId;
    const phase = this.state.phases.find((p) => p.id === event.phaseId);
    if (phase) {
      phase.status = "in_progress";
    }
  }

  private handlePhaseCompleted(event: DomainEvent): void {
    if (event._tag !== "PhaseCompleted") {
      return;
    }
    const phase = this.state.phases.find((p) => p.id === event.phaseId);
    if (phase) {
      phase.status = "done";
    }
    if (this.state.currentPhase === event.phaseId) {
      this.state.currentPhase = undefined;
    }
  }

  private handleTaskCompleted(event: DomainEvent): void {
    if (event._tag !== "TaskCompleted") {
      return;
    }
    const task = this.state.tasks.find((t) => t.id === event.taskId);
    if (task) {
      task.done = true;
    }
  }

  /**
   * Draw the full TUI to the terminal.
   */
  private draw(): void {
    const termWidth = this.output.getWidth();
    const termHeight = this.output.getHeight();

    this.output.cursorHome();

    const lines: string[] = [];

    lines.push(this.drawHeader(termWidth));
    lines.push(this.drawSeparator(termWidth));
    lines.push(this.drawStatusBar(termWidth));
    lines.push(this.drawSeparator(termWidth));

    const outputHeight = termHeight - lines.length - 2;
    lines.push(...this.drawOutput(outputHeight, termWidth));

    lines.push(this.drawFooter(termWidth));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line !== undefined) {
        this.output.clearLine();
        this.output.write(line);
        if (i < lines.length - 1) {
          this.output.write("\n");
        }
      }
    }
  }

  /**
   * Draw the header section.
   */
  private drawHeader(termWidth: number): string {
    const taskDisplay =
      this.state.task.length > termWidth - 30
        ? `${this.state.task.slice(0, termWidth - 33)}...`
        : this.state.task;

    const iterDisplay =
      this.state.maxIterations > 0
        ? `${this.state.iteration}/${this.state.maxIterations}`
        : `${this.state.iteration}`;

    return pc.bold(
      `${BOX.TOP_LEFT}${BOX.HORIZONTAL} ${taskDisplay} ${BOX.HORIZONTAL} Iteration: ${iterDisplay} ${BOX.HORIZONTAL.repeat(Math.max(0, termWidth - taskDisplay.length - iterDisplay.length - 25))}${BOX.TOP_RIGHT}`
    );
  }

  /**
   * Draw a horizontal separator.
   */
  private drawSeparator(termWidth: number): string {
    return `${BOX.T_RIGHT}${BOX.HORIZONTAL.repeat(termWidth - 2)}${BOX.T_LEFT}`;
  }

  /**
   * Draw the status bar with current phase and tool.
   */
  private drawStatusBar(termWidth: number): string {
    const phase = this.state.currentPhase
      ? pc.cyan(`Phase: ${this.state.currentPhase}`)
      : pc.dim("Phase: -");
    const tool = this.state.currentTool
      ? pc.yellow(`Tool: ${this.state.currentTool}`)
      : pc.dim("Tool: -");

    const tasks = this.state.tasks.length
      ? `Tasks: ${this.state.tasks.filter((t) => t.done).length}/${this.state.tasks.length}`
      : "Tasks: 0";

    const content = `${BOX.VERTICAL} ${phase} │ ${tool} │ ${tasks}`;
    const padding = termWidth - this.stripAnsi(content).length - 1;

    return `${content}${" ".repeat(Math.max(0, padding))}${BOX.VERTICAL}`;
  }

  /**
   * Draw the output area.
   */
  private drawOutput(height: number, termWidth: number): string[] {
    const lines: string[] = [];
    const visibleLines = this.state.outputLines.slice(-height);

    for (let i = 0; i < height; i++) {
      const line = visibleLines[i] || "";
      const truncated =
        line.length > termWidth - 4
          ? `${line.slice(0, termWidth - 7)}...`
          : line;
      const padding = termWidth - truncated.length - 4;

      lines.push(
        `${BOX.VERTICAL} ${truncated}${" ".repeat(Math.max(0, padding))} ${BOX.VERTICAL}`
      );
    }

    return lines;
  }

  /**
   * Draw the footer.
   */
  private drawFooter(termWidth: number): string {
    const help = pc.dim("Press Ctrl+C to exit");
    const padding = termWidth - this.stripAnsi(help).length - 4;

    return `${BOX.BOTTOM_LEFT}${BOX.HORIZONTAL} ${help}${BOX.HORIZONTAL.repeat(Math.max(0, padding))}${BOX.BOTTOM_RIGHT}`;
  }

  /**
   * Strip ANSI codes from a string for length calculation.
   */
  private stripAnsi(str: string): string {
    return str.replace(ANSI_PATTERN, "");
  }
}
