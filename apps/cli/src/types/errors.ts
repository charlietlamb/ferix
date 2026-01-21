/**
 * Custom error classes for Ferix CLI
 */

/**
 * Base error class for Ferix - all custom errors extend this
 */
export class FerixError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "FerixError";
    this.exitCode = exitCode;
  }
}

/**
 * User cancelled the operation (Ctrl+C or explicit cancel)
 */
export class UserCancelledError extends FerixError {
  constructor() {
    super("Cancelled by user", 0);
    this.name = "UserCancelledError";
  }
}

/**
 * Agent reported an error via <ferix:error> signal
 */
export class AgentError extends FerixError {
  readonly errorType: string;

  constructor(errorType: string, message: string) {
    super(message, 1);
    this.name = "AgentError";
    this.errorType = errorType;
  }
}

/**
 * Iteration or execution failed
 */
export class ExecutionError extends FerixError {
  constructor(message: string) {
    super(message, 1);
    this.name = "ExecutionError";
  }
}

/**
 * Required dependency is not available
 */
export class DependencyError extends FerixError {
  readonly installHint?: string;

  constructor(dependency: string, installHint?: string) {
    super(`${dependency} is not available`, 1);
    this.name = "DependencyError";
    this.installHint = installHint;
  }
}
