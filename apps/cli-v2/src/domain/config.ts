/**
 * Phase-specific prompt template overrides.
 */
export interface PhasePromptOverrides {
  /**
   * Override for the breakdown phase prompt.
   */
  readonly breakdown?: string;

  /**
   * Override for the planning phase prompt.
   */
  readonly planning?: string;

  /**
   * Override for the execution phase prompt.
   */
  readonly execution?: string;

  /**
   * Override for the check phase prompt.
   */
  readonly check?: string;

  /**
   * Override for the verify phase prompt.
   */
  readonly verify?: string;

  /**
   * Override for the review phase prompt.
   */
  readonly review?: string;

  /**
   * Override for the completion section.
   */
  readonly completion?: string;
}

/**
 * Prompt configuration for customizing LLM behavior.
 */
export interface PromptConfig {
  /**
   * Override for the system prompt.
   * If not provided, uses the default system prompt.
   */
  readonly systemPrompt?: string;

  /**
   * Phase-specific prompt overrides.
   */
  readonly phases?: PhasePromptOverrides;

  /**
   * Additional context to include in every prompt.
   */
  readonly additionalContext?: string;
}

/**
 * Configuration for a single ralph loop execution.
 */
export interface LoopConfig {
  /**
   * The task description, may include PRD path reference.
   */
  readonly task: string;

  /**
   * Maximum number of iterations to run.
   * Set to 0 for unlimited (until completion signal).
   */
  readonly maxIterations: number;

  /**
   * Commands to run for verification after execution.
   * @example ["bun lint", "bun test"]
   */
  readonly verifyCommands: readonly string[];

  /**
   * Optional session ID for resuming.
   * Auto-generated if not provided.
   */
  readonly sessionId?: string;

  /**
   * Git branch name to create.
   */
  readonly branch?: string;

  /**
   * Whether to push the branch after completion.
   */
  readonly push?: boolean;

  /**
   * Whether to create a PR after pushing.
   */
  readonly pr?: boolean;

  /**
   * Enable verbose output.
   */
  readonly verbose?: boolean;

  /**
   * Custom prompt configuration.
   */
  readonly prompts?: PromptConfig;
}

/**
 * Summary of a completed loop execution.
 */
export interface LoopSummary {
  /**
   * Total iterations executed.
   */
  readonly iterations: number;

  /**
   * Whether the loop completed successfully.
   */
  readonly success: boolean;

  /**
   * Session ID for this execution.
   */
  readonly sessionId: string;

  /**
   * Tasks that were completed.
   */
  readonly completedTasks: readonly string[];

  /**
   * Total execution time in milliseconds.
   */
  readonly durationMs: number;
}

/**
 * Error information for failed loops.
 */
export interface LoopError {
  /**
   * Error message.
   */
  readonly message: string;

  /**
   * Phase where the error occurred.
   */
  readonly phase: string;

  /**
   * Iteration number when error occurred.
   */
  readonly iteration?: number;
}
