import {
  DEFAULT_TERMINAL_HEIGHT,
  DEFAULT_TERMINAL_WIDTH,
} from "../constants.js";
import type { TerminalOutput } from "./types.js";

/**
 * Buffer-based terminal output for testing.
 * Captures all output in memory for assertion.
 */
export class BufferOutput implements TerminalOutput {
  private buffer: string[] = [];
  private width = DEFAULT_TERMINAL_WIDTH;
  private height = DEFAULT_TERMINAL_HEIGHT;
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

  fullCleanup(): void {
    this.buffer.push("[FULL_CLEANUP]");
    this.cursorHidden = false;
    this.inAlternateBuffer = false;
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
