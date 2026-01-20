/**
 * CLI constants including signal markers, default configuration values, and metadata.
 */

/** Signal markers the agent outputs */
export const SIGNALS = {
  COMPLETE: "<ferix:complete>",
  ERROR_START: "<ferix:error>",
  ERROR_END: "</ferix:error>",
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
