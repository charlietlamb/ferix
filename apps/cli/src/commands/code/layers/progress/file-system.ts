import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DateTime, Effect, Layer } from "effect";
import { ProgressStoreError } from "../../domain/errors.js";
import {
  decodeProgressFile,
  type ProgressEntry,
  type ProgressFile,
} from "../../domain/index.js";
import {
  ProgressStore,
  type ProgressStoreService,
} from "../../services/progress-store.js";

/**
 * Base directory for plan storage (progress lives alongside plans).
 */
const PLANS_DIR = ".ferix/plans";

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, ProgressStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new ProgressStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "append",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the directory path for a session's plans.
 */
function getSessionDir(sessionId: string): string {
  return join(process.cwd(), PLANS_DIR, sessionId);
}

/**
 * Gets the file path for a session's progress file.
 */
function getProgressPath(sessionId: string): string {
  return join(getSessionDir(sessionId), "progress.json");
}

/**
 * Serializes a progress file to JSON string.
 */
function serializeProgress(progress: ProgressFile): string {
  return JSON.stringify(progress, null, 2);
}

/**
 * Deserializes and validates a progress file from JSON string.
 */
function deserializeProgress(
  json: string
): Effect.Effect<ProgressFile, ProgressStoreError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (error) =>
        new ProgressStoreError({
          message: `Invalid JSON in progress file: ${String(error)}`,
          operation: "load",
          cause: error,
        }),
    });

    const validated = yield* decodeProgressFile(parsed).pipe(
      Effect.mapError(
        (error) =>
          new ProgressStoreError({
            message: `Progress validation failed: ${String(error)}`,
            operation: "load",
            cause: error,
          })
      )
    );

    return validated;
  });
}

/**
 * Creates a new empty progress file.
 */
function createEmptyProgress(
  sessionId: string,
  createdAt: string
): ProgressFile {
  return {
    sessionId,
    createdAt,
    entries: [],
  };
}

/**
 * File system progress store service implementation.
 *
 * Stores progress as JSON in `.ferix/plans/:sessionId/progress.json`.
 */
const make: ProgressStoreService = {
  append: (
    sessionId: string,
    entry: ProgressEntry
  ): Effect.Effect<void, ProgressStoreError> =>
    Effect.gen(function* () {
      const sessionDir = getSessionDir(sessionId);
      yield* ensureDir(sessionDir);

      const progressPath = getProgressPath(sessionId);

      // Load existing or create new
      const existing = yield* Effect.tryPromise({
        try: async () => {
          try {
            const content = await readFile(progressPath, "utf-8");
            return content;
          } catch {
            return null;
          }
        },
        catch: (error) =>
          new ProgressStoreError({
            message: `Failed to read progress file: ${progressPath}`,
            operation: "append",
            cause: error,
          }),
      });

      let progress: ProgressFile;
      if (existing) {
        progress = yield* deserializeProgress(existing).pipe(
          Effect.mapError(
            (err) =>
              new ProgressStoreError({
                message: err.message,
                operation: "append",
                cause: err,
              })
          )
        );
      } else {
        const now = yield* DateTime.now;
        progress = createEmptyProgress(sessionId, DateTime.formatIso(now));
      }

      // Append the new entry (create new object since arrays are readonly)
      const updatedProgress: ProgressFile = {
        ...progress,
        entries: [...progress.entries, entry],
      };

      // Write back
      yield* Effect.tryPromise({
        try: () =>
          writeFile(progressPath, serializeProgress(updatedProgress), "utf-8"),
        catch: (error) =>
          new ProgressStoreError({
            message: `Failed to write progress file: ${progressPath}`,
            operation: "append",
            cause: error,
          }),
      });
    }),

  load: (sessionId: string): Effect.Effect<ProgressFile, ProgressStoreError> =>
    Effect.gen(function* () {
      const progressPath = getProgressPath(sessionId);

      const content = yield* Effect.tryPromise({
        try: async () => {
          try {
            return await readFile(progressPath, "utf-8");
          } catch {
            // Return null for non-existent files
            return null;
          }
        },
        catch: (error) =>
          new ProgressStoreError({
            message: `Failed to read progress file: ${progressPath}`,
            operation: "load",
            cause: error,
          }),
      });

      if (content === null) {
        // Return empty progress file if none exists
        const now = yield* DateTime.now;
        return createEmptyProgress(sessionId, DateTime.formatIso(now));
      }

      return yield* deserializeProgress(content);
    }),

  getRecent: (
    sessionId: string,
    count: number
  ): Effect.Effect<readonly ProgressEntry[], ProgressStoreError> =>
    Effect.gen(function* () {
      const progress = yield* make.load(sessionId);
      const entries = progress.entries;
      return entries.slice(-count);
    }),
};

/**
 * Live Layer for the file system progress store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const progressStore = yield* ProgressStore;
 *   yield* progressStore.append(sessionId, entry);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemProgress.Live)));
 * ```
 */
const Live = Layer.succeed(ProgressStore, make);

/**
 * FileSystemProgress namespace containing the Live layer.
 */
export const FileSystemProgress = {
  Live,
} as const;
