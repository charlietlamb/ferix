import { appendFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { OutputStoreError } from "../../domain/errors.js";
import {
  OutputStore,
  type OutputStoreService,
} from "../../services/output-store.js";

/**
 * Base directory for session storage (global, in user's home directory).
 */
const SESSIONS_DIR = ".ferix/sessions";

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, OutputStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new OutputStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "append",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the directory path for a session.
 */
function getSessionDir(sessionId: string): string {
  return join(homedir(), SESSIONS_DIR, sessionId);
}

/**
 * Gets the file path for a session's output log.
 */
function getOutputPath(sessionId: string): string {
  return join(getSessionDir(sessionId), "output.log");
}

/**
 * File system output store service implementation.
 *
 * Stores session output as plain text in `.ferix/sessions/:sessionId/output.log`.
 * Lines are appended as they come in and the full log is read when viewing a session.
 */
const make: OutputStoreService = {
  append: (
    sessionId: string,
    lines: readonly string[]
  ): Effect.Effect<void, OutputStoreError> =>
    Effect.gen(function* () {
      if (lines.length === 0) {
        return;
      }

      const sessionDir = getSessionDir(sessionId);
      yield* ensureDir(sessionDir);

      const outputPath = getOutputPath(sessionId);
      const content = `${lines.join("\n")}\n`;

      yield* Effect.tryPromise({
        try: () => appendFile(outputPath, content, "utf-8"),
        catch: (error) =>
          new OutputStoreError({
            message: `Failed to append to output log: ${outputPath}`,
            operation: "append",
            cause: error,
          }),
      });
    }),

  read: (
    sessionId: string
  ): Effect.Effect<readonly string[], OutputStoreError> =>
    Effect.gen(function* () {
      const outputPath = getOutputPath(sessionId);

      const content = yield* Effect.tryPromise({
        try: () => readFile(outputPath, "utf-8"),
        catch: (error) =>
          new OutputStoreError({
            message: `Failed to read output log: ${outputPath}`,
            operation: "read",
            cause: error,
          }),
      });

      // Split by newlines, filter out empty trailing line
      const lines = content.split("\n");
      if (lines.length > 0 && lines.at(-1) === "") {
        lines.pop();
      }

      return lines;
    }),
};

/**
 * Live Layer for the file system output store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const outputStore = yield* OutputStore;
 *   yield* outputStore.append(sessionId, ["Line 1", "Line 2"]);
 *   const lines = yield* outputStore.read(sessionId);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemOutput.Live)));
 * ```
 */
const Live = Layer.succeed(OutputStore, make);

/**
 * FileSystemOutput namespace containing the Live layer.
 */
export const FileSystemOutput = {
  Live,
} as const;
