import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { SessionStoreError } from "../../domain/errors.js";
import { decodeSession } from "../../domain/schemas.js";
import {
  type Session,
  SessionStore,
  type SessionStoreService,
} from "../../services/session-store.js";

/**
 * Base directory for session storage.
 */
const SESSIONS_DIR = ".ferix/sessions";

/**
 * Word lists for generating human-readable session IDs.
 */
const ADJECTIVES = [
  "brave",
  "calm",
  "eager",
  "fair",
  "gentle",
  "happy",
  "keen",
  "lively",
  "merry",
  "noble",
  "proud",
  "quick",
  "sharp",
  "swift",
  "warm",
  "wise",
  "bold",
  "bright",
  "clear",
  "crisp",
];

const COLORS = [
  "amber",
  "azure",
  "coral",
  "crimson",
  "cyan",
  "gold",
  "jade",
  "indigo",
  "ivory",
  "lime",
  "magenta",
  "navy",
  "olive",
  "pearl",
  "ruby",
  "silver",
  "teal",
  "violet",
  "bronze",
  "copper",
];

const ANIMALS = [
  "badger",
  "falcon",
  "dolphin",
  "eagle",
  "fox",
  "hawk",
  "jaguar",
  "koala",
  "lion",
  "otter",
  "panda",
  "raven",
  "tiger",
  "wolf",
  "bear",
  "crane",
  "deer",
  "elk",
  "owl",
  "seal",
];

/**
 * Maximum retries for collision detection.
 */
const MAX_ID_RETRIES = 5;

/**
 * Generates a human-readable session ID with timestamp for uniqueness.
 *
 * Format: "adjective-color-animal-timestamp"
 * Example: "brave-azure-falcon-1705678901234"
 *
 * The timestamp suffix ensures uniqueness at scale while maintaining
 * human-readability. If collisions occur (rare), retries with new random words.
 */
function generateSessionId(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const timestamp = Date.now();
  return `${adjective}-${color}-${animal}-${timestamp}`;
}

/**
 * Generates a fallback UUID-style ID if word-based IDs keep colliding.
 */
function generateFallbackId(): string {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `session-${timestamp}-${random}`;
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
  return join(process.cwd(), SESSIONS_DIR, `${sessionId}.json`);
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
/**
 * Checks if a session file already exists.
 */
function sessionExists(sessionId: string): Effect.Effect<boolean> {
  return Effect.tryPromise({
    try: async () => {
      const { access } = await import("node:fs/promises");
      await access(getSessionPath(sessionId));
      return true;
    },
    catch: () => false,
  }).pipe(Effect.orElseSucceed(() => false));
}

const make: SessionStoreService = {
  create: (originalTask: string): Effect.Effect<Session, SessionStoreError> =>
    Effect.gen(function* () {
      const sessionsDir = join(process.cwd(), SESSIONS_DIR);
      yield* ensureDir(sessionsDir);

      // Try to generate a unique session ID with collision detection
      let sessionId: string | undefined;
      let retries = 0;

      while (retries < MAX_ID_RETRIES) {
        const candidateId = generateSessionId();
        const exists = yield* sessionExists(candidateId);

        if (!exists) {
          sessionId = candidateId;
          break;
        }

        retries++;
      }

      // Fallback to UUID-style if word-based IDs keep colliding
      if (!sessionId) {
        sessionId = generateFallbackId();
      }

      const session: Session = {
        id: sessionId,
        createdAt: new Date().toISOString(),
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
export const Live = Layer.succeed(SessionStore, make);

/**
 * FileSystemSession namespace containing the Live layer.
 */
export const FileSystemSession = {
  Live,
} as const;
