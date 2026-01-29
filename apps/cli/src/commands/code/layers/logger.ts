import {
  createWriteStream,
  existsSync,
  mkdirSync,
  type WriteStream,
} from "node:fs";
import { join } from "node:path";
import { Layer, Logger, LogLevel } from "effect";

/**
 * Base directory for debug logs.
 */
const LOGS_DIR = ".ferix/logs";

/**
 * Ensures the logs directory exists.
 */
function ensureLogsDir(): void {
  const logsDir = join(process.cwd(), LOGS_DIR);
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
}

/**
 * Formats annotations as logfmt key=value pairs.
 */
function formatAnnotations(annotations: ReadonlyMap<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of annotations) {
    parts.push(`${key}=${JSON.stringify(value)}`);
  }
  return parts.join(" ");
}

/**
 * Creates a file logger that writes to .ferix/logs/<session-id>.log
 */
function createFileLogger(
  logStream: WriteStream
): Logger.Logger<unknown, void> {
  return Logger.make(({ logLevel, message, date, annotations }) => {
    const annotationsStr = formatAnnotations(annotations);
    const messageStr =
      typeof message === "string" ? message : JSON.stringify(message);
    const entry = `timestamp=${date.toISOString()} level=${logLevel.label} message=${JSON.stringify(messageStr)}${annotationsStr ? ` ${annotationsStr}` : ""}`;
    logStream.write(`${entry}\n`);
  });
}

/**
 * Creates a logger layer that writes debug logs to a file.
 *
 * When debug is enabled, logs are written to .ferix/logs/<session-id>.log
 * in logfmt format. The minimum log level is set to Debug to capture
 * all debug logs from Effect.logDebug calls.
 *
 * @param debug - Whether debug logging is enabled
 * @param sessionId - Session ID used for the log file name
 * @returns A Layer that configures Effect's logging system
 *
 * @example
 * ```typescript
 * const loggerLayer = createLoggerLayer(true, "my-session-123");
 *
 * // Merge with other layers
 * const layers = Layer.merge(ProductionLayers, loggerLayer);
 *
 * // Run with logging enabled
 * Effect.runPromise(program.pipe(Effect.provide(layers)));
 * ```
 */
export function createLoggerLayer(
  debug: boolean,
  sessionId: string
): Layer.Layer<never, never, never> {
  if (!debug) {
    return Layer.empty;
  }

  // Ensure logs directory exists
  ensureLogsDir();

  const logPath = join(process.cwd(), LOGS_DIR, `${sessionId}.log`);
  const logStream = createWriteStream(logPath, { flags: "a" });

  const fileLogger = createFileLogger(logStream);

  return Layer.merge(
    Logger.minimumLogLevel(LogLevel.Debug),
    Logger.replace(Logger.defaultLogger, fileLogger)
  );
}
