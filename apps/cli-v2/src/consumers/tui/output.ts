/**
 * Interface for terminal output operations.
 * Abstracts ANSI escape codes to allow for testing and alternative backends.
 */
export interface TerminalOutput {
  /**
   * Write text to the output.
   */
  readonly write: (text: string) => void;

  /**
   * Write text followed by a newline.
   */
  readonly writeLine: (text: string) => void;

  /**
   * Clear the entire screen.
   */
  readonly clearScreen: () => void;

  /**
   * Move cursor to home position (top-left).
   */
  readonly cursorHome: () => void;

  /**
   * Hide the cursor.
   */
  readonly hideCursor: () => void;

  /**
   * Show the cursor.
   */
  readonly showCursor: () => void;

  /**
   * Enter alternate buffer (full-screen mode).
   */
  readonly enterAlternateBuffer: () => void;

  /**
   * Exit alternate buffer.
   */
  readonly exitAlternateBuffer: () => void;

  /**
   * Clear the current line.
   */
  readonly clearLine: () => void;

  /**
   * Get the terminal width.
   */
  readonly getWidth: () => number;

  /**
   * Get the terminal height.
   */
  readonly getHeight: () => number;

  /**
   * Subscribe to resize events.
   * Returns an unsubscribe function.
   */
  readonly onResize: (callback: () => void) => () => void;

  /**
   * Move cursor to specific position.
   */
  readonly moveTo: (row: number, col: number) => void;

  /**
   * Enable mouse tracking (SGR format).
   */
  readonly enableMouse: () => void;

  /**
   * Disable mouse tracking.
   */
  readonly disableMouse: () => void;
}

/**
 * ANSI escape codes for terminal control.
 */
const ANSI = {
  CLEAR_SCREEN: "\x1b[2J",
  CURSOR_HOME: "\x1b[H",
  CURSOR_HIDE: "\x1b[?25l",
  CURSOR_SHOW: "\x1b[?25h",
  ALTERNATE_BUFFER_ON: "\x1b[?1049h",
  ALTERNATE_BUFFER_OFF: "\x1b[?1049l",
  CLEAR_LINE: "\x1b[2K",
  MOUSE_ON: "\x1b[?1000h\x1b[?1006h",
  MOUSE_OFF: "\x1b[?1000l\x1b[?1006l",
} as const;

/**
 * ANSI terminal output implementation.
 * Uses actual ANSI escape codes and process.stdout.
 */
export class ANSIOutput implements TerminalOutput {
  private width: number;
  private height: number;
  private readonly resizeListeners: Set<() => void> = new Set();

  constructor() {
    this.width = process.stdout.columns || 80;
    this.height = process.stdout.rows || 24;

    process.stdout.on("resize", () => {
      this.width = process.stdout.columns || 80;
      this.height = process.stdout.rows || 24;
      for (const listener of this.resizeListeners) {
        listener();
      }
    });
  }

  write(text: string): void {
    process.stdout.write(text);
  }

  writeLine(text: string): void {
    process.stdout.write(`${text}\n`);
  }

  clearScreen(): void {
    process.stdout.write(ANSI.CLEAR_SCREEN);
  }

  cursorHome(): void {
    process.stdout.write(ANSI.CURSOR_HOME);
  }

  hideCursor(): void {
    process.stdout.write(ANSI.CURSOR_HIDE);
  }

  showCursor(): void {
    process.stdout.write(ANSI.CURSOR_SHOW);
  }

  enterAlternateBuffer(): void {
    process.stdout.write(ANSI.ALTERNATE_BUFFER_ON);
  }

  exitAlternateBuffer(): void {
    process.stdout.write(ANSI.ALTERNATE_BUFFER_OFF);
  }

  clearLine(): void {
    process.stdout.write(ANSI.CLEAR_LINE);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  onResize(callback: () => void): () => void {
    this.resizeListeners.add(callback);
    return () => {
      this.resizeListeners.delete(callback);
    };
  }

  moveTo(row: number, col: number): void {
    process.stdout.write(`\x1b[${row};${col}H`);
  }

  enableMouse(): void {
    process.stdout.write(ANSI.MOUSE_ON);
  }

  disableMouse(): void {
    process.stdout.write(ANSI.MOUSE_OFF);
  }
}

/**
 * Buffer-based terminal output for testing.
 * Captures all output in memory for assertion.
 */
export class BufferOutput implements TerminalOutput {
  private buffer: string[] = [];
  private width = 80;
  private height = 24;
  private cursorHidden = false;
  private inAlternateBuffer = false;

  write(text: string): void {
    this.buffer.push(text);
  }

  writeLine(text: string): void {
    this.buffer.push(`${text}\n`);
  }

  clearScreen(): void {
    this.buffer.push("[CLEAR_SCREEN]");
  }

  cursorHome(): void {
    this.buffer.push("[CURSOR_HOME]");
  }

  hideCursor(): void {
    this.cursorHidden = true;
    this.buffer.push("[HIDE_CURSOR]");
  }

  showCursor(): void {
    this.cursorHidden = false;
    this.buffer.push("[SHOW_CURSOR]");
  }

  enterAlternateBuffer(): void {
    this.inAlternateBuffer = true;
    this.buffer.push("[ENTER_ALT_BUFFER]");
  }

  exitAlternateBuffer(): void {
    this.inAlternateBuffer = false;
    this.buffer.push("[EXIT_ALT_BUFFER]");
  }

  clearLine(): void {
    this.buffer.push("[CLEAR_LINE]");
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  onResize(_callback: () => void): () => void {
    // No-op for buffer output - tests can call setDimensions directly
    return () => {
      // Intentionally empty - no cleanup needed for buffer output
    };
  }

  moveTo(row: number, col: number): void {
    this.buffer.push(`[MOVE_TO:${row},${col}]`);
  }

  enableMouse(): void {
    this.buffer.push("[ENABLE_MOUSE]");
  }

  disableMouse(): void {
    this.buffer.push("[DISABLE_MOUSE]");
  }

  /**
   * Get all captured output.
   */
  getOutput(): string[] {
    return [...this.buffer];
  }

  /**
   * Get all output as a single string.
   */
  getOutputString(): string {
    return this.buffer.join("");
  }

  /**
   * Clear the buffer.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Check if cursor is hidden.
   */
  isCursorHidden(): boolean {
    return this.cursorHidden;
  }

  /**
   * Check if in alternate buffer mode.
   */
  isInAlternateBuffer(): boolean {
    return this.inAlternateBuffer;
  }
}
