import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DateTime, Effect, Layer, Ref } from "effect";
import {
  LOG_LEVEL_PRIORITY,
  type LogEntry,
  Logger,
  type LoggerService,
  type LogLevel,
} from "../../services/logger.js";

/**
 * Formats a log entry as JSON for file output.
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Ensures the directory for a file path exists.
 */
function ensureDir(filePath: string): Effect.Effect<void, never, never> {
  return Effect.tryPromise({
    try: () => mkdir(dirname(filePath), { recursive: true }),
    catch: () => undefined,
  }).pipe(
    Effect.catchAll(() => Effect.void),
    Effect.asVoid
  );
}

/**
 * Writes a log entry to a file.
 */
function writeToFile(
  filePath: string,
  entry: LogEntry
): Effect.Effect<void, never, never> {
  return Effect.tryPromise({
    try: () => appendFile(filePath, `${formatLogEntry(entry)}\n`, "utf-8"),
    catch: (error) => {
      console.error(`Failed to write log entry: ${String(error)}`);
      return undefined;
    },
  }).pipe(
    Effect.catchAll(() => Effect.void),
    Effect.asVoid
  );
}

/**
 * Creates a file logger service.
 *
 * @param filePath - Path to the log file
 * @param levelRef - Reference to the current log level
 */
function createFileLogger(
  filePath: string,
  levelRef: Ref.Ref<LogLevel>
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

      yield* writeToFile(filePath, entry);
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
 * Configuration for file logger.
 */
export interface FileLoggerConfig {
  /**
   * Path to the log file.
   * @default ".ferix/logs/ferix.log"
   */
  readonly path?: string;

  /**
   * Minimum log level to output.
   * @default "info"
   */
  readonly level?: LogLevel;
}

/**
 * Default log file path.
 */
const DEFAULT_LOG_PATH = ".ferix/logs/ferix.log";

/**
 * Creates a Layer for the file logger.
 *
 * @param config - Logger configuration
 * @returns A Layer providing the file logger
 *
 * @example
 * ```typescript
 * const loggerLayer = FileLogger.layer({ path: "./logs/app.log", level: "debug" });
 *
 * const program = Effect.gen(function* () {
 *   const logger = yield* Logger;
 *   yield* logger.info("Hello, world!");
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(loggerLayer)));
 * ```
 */
export function layer(config: FileLoggerConfig = {}): Layer.Layer<Logger> {
  return Layer.effect(
    Logger,
    Effect.gen(function* () {
      const filePath = join(process.cwd(), config.path ?? DEFAULT_LOG_PATH);
      yield* ensureDir(filePath);
      const levelRef = yield* Ref.make<LogLevel>(config.level ?? "info");
      return createFileLogger(filePath, levelRef);
    })
  );
}

/**
 * Default Live Layer for file logger.
 */
export const Live = layer();

/**
 * FileLogger namespace containing the Live layer and factory.
 */
export const FileLogger = {
  Live,
  layer,
} as const;
