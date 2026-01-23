import { Context, type Effect } from "effect";

/**
 * Log level for filtering messages.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured log entry.
 */
export interface LogEntry {
  /**
   * Log level.
   */
  readonly level: LogLevel;

  /**
   * Log message.
   */
  readonly message: string;

  /**
   * ISO timestamp.
   */
  readonly timestamp: string;

  /**
   * Optional context data.
   */
  readonly context?: Record<string, unknown>;
}

/**
 * Service interface for logging.
 *
 * Provides structured logging for observability across the application.
 * Implementations can write to console, files, or external services.
 *
 * @example
 * ```typescript
 * const logger = yield* Logger;
 *
 * yield* logger.info("Iteration started", { iteration: 1 });
 * yield* logger.error("Plan update failed", { planId: "task-1", error: "..." });
 * ```
 */
export interface LoggerService {
  /**
   * Log a debug message.
   */
  readonly debug: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>;

  /**
   * Log an info message.
   */
  readonly info: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>;

  /**
   * Log a warning message.
   */
  readonly warn: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>;

  /**
   * Log an error message.
   */
  readonly error: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>;

  /**
   * Get the current log level.
   */
  readonly getLevel: () => Effect.Effect<LogLevel>;

  /**
   * Set the minimum log level.
   */
  readonly setLevel: (level: LogLevel) => Effect.Effect<void>;
}

/**
 * Effect Tag for the Logger service.
 *
 * Use this tag to depend on logging without coupling to a specific implementation.
 */
export class Logger extends Context.Tag("@ferix/Logger")<
  Logger,
  LoggerService
>() {}

/**
 * Log level priority for filtering.
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
