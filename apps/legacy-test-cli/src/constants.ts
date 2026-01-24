/**
 * CLI constants including signal markers, default configuration values, and metadata.
 */

/** Signal markers the agent outputs */
export const SIGNALS = {
  COMPLETE: "<ferix:complete>",
  ERROR_START: "<ferix:error>",
  ERROR_END: "</ferix:error>",
  // Task tracking signals
  TASKS_START: "<ferix:tasks>",
  TASKS_END: "</ferix:tasks>",
  TASK_DONE: "<ferix:task-done",
  // Phase tracking signals
  PHASES_START: "<ferix:phases",
  PHASES_END: "</ferix:phases>",
  PHASE_START: "<ferix:phase-start",
  PHASE_DONE: "<ferix:phase-done",
  PHASE_FAILED: "<ferix:phase-failed",
  // Criterion tracking signals (for check stage)
  CRITERION_PASSED: "<ferix:criterion-passed",
  CRITERION_FAILED: "<ferix:criterion-failed",
  // Check stage signals (success criteria verification)
  CHECK_PASSED: "<ferix:check-passed/>",
  CHECK_FAILED: "<ferix:check-failed/>",
  // Review stage signals (code quality improvement)
  REVIEW_COMPLETE: "<ferix:review-complete/>",
  REVIEW_CHANGES_MADE: "<ferix:review-changes-made/>",
} as const;

/** Default values */
export const DEFAULTS = {
  PROGRESS_FILE: "./.ferix/PROGRESS.md",
  ITERATIONS: 1,
} as const;

/** CLI metadata */
export const CLI = {
  NAME: "ferix",
  VERSION: "0.1.0",
  DESCRIPTION: "Composable RALPH loops for AI coding agents",
} as const;

/** UI layout constants */
export const UI = {
  BOX_MAX_WIDTH: 60,
  BOX_MARGIN: 4,
  TASK_DISPLAY_MAX_LENGTH: 40,
  COMMAND_DISPLAY_MAX_LENGTH: 60,
  DEFAULT_TERMINAL_ROWS: 24,
  DEFAULT_TERMINAL_COLS: 80,
  KEY_COLUMN_WIDTH: 12,
} as const;

/** Buffer sizes for stream processing */
export const BUFFER = {
  MAX_SIZE: 5000,
  FERIX_TAG_SIZE: 50,
} as const;

/** Prompt fragment ordering */
export const FRAGMENT_ORDER = {
  TASK: 0,
  VALIDATION: 1,
  TASK_BREAKDOWN: 2,
  VERIFY: 10,
  GIT: 20,
  PROGRESS: 30,
  LOOP: 40,
  ERROR: 50,
} as const;

/** User-facing messages */
export const MESSAGES = {
  CLAUDE_NOT_INSTALLED: "Claude Code CLI is not installed or not in PATH.",
  CLAUDE_INSTALL_HINT: "Install with: npm i -g @anthropic-ai/claude-code",
  GH_INSTALL_HINT: "Install with: brew install gh",
} as const;
