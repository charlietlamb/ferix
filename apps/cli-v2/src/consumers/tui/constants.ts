/**
 * Maximum number of output lines to retain in state.
 * Prevents unbounded memory growth during long sessions.
 */
export const MAX_OUTPUT_LINES = 1000;

/**
 * Maximum length for truncated tool input display.
 */
export const MAX_TOOL_INPUT_LENGTH = 60;

/**
 * Default terminal width when columns cannot be determined.
 */
export const DEFAULT_TERMINAL_WIDTH = 80;

/**
 * Default terminal height when rows cannot be determined.
 */
export const DEFAULT_TERMINAL_HEIGHT = 24;

/**
 * Number of fixed rows for header/footer in TUI layout.
 */
export const FIXED_ROWS = 6;

/**
 * Mouse wheel scroll delta (lines per scroll tick).
 */
export const MOUSE_SCROLL_DELTA = 3;
