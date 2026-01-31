import {
  DEFAULT_TERMINAL_HEIGHT,
  DEFAULT_TERMINAL_WIDTH,
} from "../constants.js";
import type { TerminalOutput } from "./types.js";

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
    this.width = process.stdout.columns || DEFAULT_TERMINAL_WIDTH;
    this.height = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;

    process.stdout.on("resize", () => {
      this.width = process.stdout.columns || DEFAULT_TERMINAL_WIDTH;
      this.height = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;
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

  /** Full terminal cleanup in a single write for signal handlers */
  fullCleanup(): void {
    process.stdout.write(
      ANSI.MOUSE_OFF + ANSI.CURSOR_SHOW + ANSI.ALTERNATE_BUFFER_OFF
    );
  }
}
