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
