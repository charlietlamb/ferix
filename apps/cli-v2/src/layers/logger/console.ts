import { DateTime, Effect, Layer, Ref } from "effect";
import {
  LOG_LEVEL_PRIORITY,
  type LogEntry,
  Logger,
  type LoggerService,
  type LogLevel,
} from "../../services/logger.js";

/**
 * ANSI color codes for log levels.
 */
const COLORS = {
  debug: "\x1b[90m", // Gray
  info: "\x1b[36m", // Cyan
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  reset: "\x1b[0m",
} as const;

/**
 * Formats a log entry for console output.
 */
function formatLogEntry(entry: LogEntry, useColors: boolean): string {
  const color = useColors ? COLORS[entry.level] : "";
  const reset = useColors ? COLORS.reset : "";
  const levelStr = entry.level.toUpperCase().padEnd(5);
  const time = entry.timestamp.split("T")[1]?.slice(0, 8) ?? entry.timestamp;

  let message = `${color}[${time}] ${levelStr}${reset} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextStr = JSON.stringify(entry.context);
    message += ` ${color}${contextStr}${reset}`;
  }

  return message;
}

/**
 * Creates a console logger service.
 *
 * @param levelRef - Reference to the current log level
 * @param useColors - Whether to use ANSI colors in output
 */
function createConsoleLogger(
  levelRef: Ref.Ref<LogLevel>,
  useColors: boolean
): LoggerService {
  const log = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Effect.Effect<void> =>
    Effect.gen(function* () {
      const currentLevel = yield* Ref.get(levelRef);

      if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[currentLevel]) {
        return;
      }

      const now = yield* DateTime.now;
      const entry: LogEntry = {
        level,
        message,
        timestamp: DateTime.formatIso(now),
        context,
      };

      const formatted = formatLogEntry(entry, useColors);

      if (level === "error") {
        console.error(formatted);
      } else if (level === "warn") {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    });

  return {
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
    getLevel: () => Ref.get(levelRef),
    setLevel: (level) => Ref.set(levelRef, level),
  };
}

/**
 * Configuration for console logger.
 */
export interface ConsoleLoggerConfig {
  /**
   * Minimum log level to output.
   * @default "info"
   */
  readonly level?: LogLevel;

  /**
   * Whether to use ANSI colors.
   * @default true
   */
  readonly colors?: boolean;
}

/**
 * Creates a Layer for the console logger.
 *
 * @param config - Logger configuration
 * @returns A Layer providing the console logger
 *
 * @example
 * ```typescript
 * const loggerLayer = ConsoleLogger.layer({ level: "debug" });
 *
 * const program = Effect.gen(function* () {
 *   const logger = yield* Logger;
 *   yield* logger.info("Hello, world!");
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(loggerLayer)));
 * ```
 */
export function layer(config: ConsoleLoggerConfig = {}): Layer.Layer<Logger> {
  return Layer.effect(
    Logger,
    Effect.gen(function* () {
      const levelRef = yield* Ref.make<LogLevel>(config.level ?? "info");
      return createConsoleLogger(levelRef, config.colors ?? true);
    })
  );
}

/**
 * Default Live Layer for console logger.
 */
export const Live = layer();

/**
 * ConsoleLogger namespace containing the Live layer and factory.
 */
export const ConsoleLogger = {
  Live,
  layer,
} as const;
