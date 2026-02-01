import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { DateTime, Effect, Layer } from "effect";
import { humanId } from "human-id";
import { SessionStoreError } from "../../domain/errors.js";
import { decodeSession, type Session } from "../../domain/index.js";
import {
  SessionStore,
  type SessionStoreService,
} from "../../services/session-store.js";

/**
 * Base directory for session storage (global, in user's home directory).
 */
const SESSIONS_DIR = ".ferix/sessions";

/**
 * Generates a human-readable session ID with timestamp for uniqueness.
 *
 * Format: "adjective-noun-verb-timestamp"
 * Example: "calm-snails-dream-1705678901234"
 *
 * Uses the human-id package which provides a pool of 15m+ combinations.
 * The timestamp suffix ensures uniqueness.
 *
 * @param timestampMs - Timestamp in milliseconds to append
 */
function generateSessionId(timestampMs: number): string {
  const id = humanId({ separator: "-", capitalize: false });
  return `${id}-${timestampMs}`;
}

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, SessionStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new SessionStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "create",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the file path for a session.
 */
function getSessionPath(sessionId: string): string {
  return join(homedir(), SESSIONS_DIR, `${sessionId}.json`);
}

/**
 * Serializes a session to JSON string.
 */
function serializeSession(session: Session): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Deserializes and validates a session from JSON string.
 * Uses Effect Schema for runtime validation.
 */
function deserializeSession(
  json: string
): Effect.Effect<Session, SessionStoreError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (error) =>
        new SessionStoreError({
          message: `Invalid JSON in session file: ${String(error)}`,
          operation: "get",
          cause: error,
        }),
    });

    const validated = yield* decodeSession(parsed).pipe(
      Effect.mapError(
        (error) =>
          new SessionStoreError({
            message: `Session validation failed: ${String(error)}`,
            operation: "get",
            cause: error,
          })
      )
    );

    return validated;
  });
}

/**
 * File system session store service implementation.
 *
 * Stores sessions as JSON files in `.ferix/sessions/`.
 */
const make: SessionStoreService = {
  create: (
    originalTask: string,
    providedSessionId?: string
  ): Effect.Effect<Session, SessionStoreError> =>
    Effect.gen(function* () {
      const sessionsDir = join(homedir(), SESSIONS_DIR);
      yield* ensureDir(sessionsDir);

      const now = yield* DateTime.now;
      const timestampMs = DateTime.toEpochMillis(now);
      const sessionId = providedSessionId ?? generateSessionId(timestampMs);
      const session: Session = {
        id: sessionId,
        createdAt: DateTime.formatIso(now),
        status: "active",
        originalTask,
        completedTasks: [],
      };

      const sessionPath = getSessionPath(sessionId);

      yield* Effect.tryPromise({
        try: () => writeFile(sessionPath, serializeSession(session), "utf-8"),
        catch: (error) =>
          new SessionStoreError({
            message: `Failed to write session file: ${sessionPath}`,
            operation: "create",
            cause: error,
          }),
      });

      return session;
    }),

  get: (sessionId: string): Effect.Effect<Session, SessionStoreError> =>
    Effect.gen(function* () {
      const sessionPath = getSessionPath(sessionId);

      const content = yield* Effect.tryPromise({
        try: () => readFile(sessionPath, "utf-8"),
        catch: (error) =>
          new SessionStoreError({
            message: `Failed to read session file: ${sessionPath}`,
            operation: "get",
            cause: error,
          }),
      });

      return yield* deserializeSession(content);
    }),

  update: (
    sessionId: string,
    session: Session
  ): Effect.Effect<void, SessionStoreError> =>
    Effect.gen(function* () {
      const sessionPath = getSessionPath(sessionId);

      yield* Effect.tryPromise({
        try: () => writeFile(sessionPath, serializeSession(session), "utf-8"),
        catch: (error) =>
          new SessionStoreError({
            message: `Failed to update session file: ${sessionPath}`,
            operation: "update",
            cause: error,
          }),
      });
    }),

  list: (): Effect.Effect<readonly Session[], SessionStoreError> =>
    Effect.gen(function* () {
      const sessionsDir = join(homedir(), SESSIONS_DIR);

      // Read directory entries, return empty array if directory doesn't exist
      const entries = yield* Effect.tryPromise({
        try: async () => {
          try {
            return await readdir(sessionsDir);
          } catch (error) {
            // Return empty if directory doesn't exist
            if (
              error instanceof Error &&
              "code" in error &&
              error.code === "ENOENT"
            ) {
              return [];
            }
            throw error;
          }
        },
        catch: (error) =>
          new SessionStoreError({
            message: `Failed to read sessions directory: ${sessionsDir}`,
            operation: "list",
            cause: error,
          }),
      });

      // Filter for .json files
      const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));

      // Parse each session file, skipping invalid ones
      const sessions: Session[] = [];
      for (const file of jsonFiles) {
        const filePath = join(sessionsDir, file);
        const fileContent = yield* Effect.tryPromise({
          try: () => readFile(filePath, "utf-8"),
          catch: () =>
            new SessionStoreError({
              message: `Failed to read session file: ${filePath}`,
              operation: "list",
            }),
        }).pipe(Effect.option);

        if (fileContent._tag === "None") {
          continue;
        }

        const parseResult = yield* deserializeSession(fileContent.value).pipe(
          Effect.option
        );

        if (parseResult._tag === "Some") {
          sessions.push(parseResult.value);
        }
      }

      // Sort by createdAt descending (most recent first)
      sessions.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      return sessions;
    }),
};

/**
 * Live Layer for the file system session store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const sessionStore = yield* SessionStore;
 *   const session = yield* sessionStore.create("Implement feature");
 *   return session;
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemSession.Live)));
 * ```
 */
const Live = Layer.succeed(SessionStore, make);

/**
 * FileSystemSession namespace containing the Live layer.
 */
export const FileSystemSession = {
  Live,
} as const;
