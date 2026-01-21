/**
 * Core configuration and result types for Ferix CLI
 */

/**
 * Ferix configuration built from CLI args or interactive prompts
 */
export interface FerixConfig {
  /** The task/prompt for the AI to work on */
  task: string;

  /** Commands to run for verification (e.g., ["bun lint", "bun test"]) */
  verify: string[];

  /** Number of loop iterations */
  iterations: number;

  /** Loop until <ferix:complete> signal (overrides iterations) */
  untilComplete: boolean;

  /** Branch to create (undefined = stay on current) */
  branch?: string;

  /** Original branch we branched from (for PR base) */
  baseBranch?: string;

  /** Push branch after completion */
  push: boolean;

  /** Create PR after push */
  pr: boolean;

  /** Auto-commit changes */
  commit: boolean;

  /** Progress file path (false = disabled) */
  progress: string | false;

  /** Show prompt without executing */
  dryRun: boolean;

  /** Verbose output */
  verbose: boolean;
}

/**
 * Result from engine execution
 */
export interface ExecuteResult {
  /** Command exited successfully */
  success: boolean;

  /** Stdout from the command */
  output: string;

  /** Agent signalled completion with <ferix:complete> */
  complete: boolean;

  /** Agent signalled error with <ferix:error> */
  hasError: boolean;

  /** Extracted error message if hasError */
  errorMessage?: string;
}

/**
 * Prompt fragment for composition
 */
export interface PromptFragment {
  id: string;
  content: string;
  order: number;
}

/**
 * A task extracted from the work to be done
 */
export interface Task {
  /** Unique identifier (numeric string, e.g. "1", "2") */
  id: string;
  /** Brief description of the task */
  description: string;
  /** Whether the task has been completed */
  done: boolean;
}
