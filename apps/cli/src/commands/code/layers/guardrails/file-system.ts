import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DateTime, Effect, Layer } from "effect";
import { GuardrailsStoreError } from "../../domain/errors.js";
import {
  decodeGuardrailsFile,
  type Guardrail,
  type GuardrailsFile,
} from "../../domain/index.js";
import {
  GuardrailsStore,
  type GuardrailsStoreService,
} from "../../services/guardrails-store.js";

/**
 * Base directory for plan storage (guardrails live alongside plans).
 */
const PLANS_DIR = ".ferix/plans";

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, GuardrailsStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new GuardrailsStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "add",
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
 * Gets the file path for a session's guardrails file.
 */
function getGuardrailsPath(sessionId: string): string {
  return join(getSessionDir(sessionId), "guardrails.json");
}

/**
 * Serializes a guardrails file to JSON string.
 */
function serializeGuardrails(guardrails: GuardrailsFile): string {
  return JSON.stringify(guardrails, null, 2);
}

/**
 * Deserializes and validates a guardrails file from JSON string.
 */
function deserializeGuardrails(
  json: string
): Effect.Effect<GuardrailsFile, GuardrailsStoreError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (error) =>
        new GuardrailsStoreError({
          message: `Invalid JSON in guardrails file: ${String(error)}`,
          operation: "load",
          cause: error,
        }),
    });

    const validated = yield* decodeGuardrailsFile(parsed).pipe(
      Effect.mapError(
        (error) =>
          new GuardrailsStoreError({
            message: `Guardrails validation failed: ${String(error)}`,
            operation: "load",
            cause: error,
          })
      )
    );

    return validated;
  });
}

/**
 * Creates a new empty guardrails file.
 */
function createEmptyGuardrails(
  sessionId: string,
  createdAt: string
): GuardrailsFile {
  return {
    sessionId,
    createdAt,
    guardrails: [],
  };
}

/**
 * File system guardrails store service implementation.
 *
 * Stores guardrails as JSON in `.ferix/plans/:sessionId/guardrails.json`.
 */
const make: GuardrailsStoreService = {
  add: (
    sessionId: string,
    guardrail: Guardrail
  ): Effect.Effect<void, GuardrailsStoreError> =>
    Effect.gen(function* () {
      const sessionDir = getSessionDir(sessionId);
      yield* ensureDir(sessionDir);

      const guardrailsPath = getGuardrailsPath(sessionId);

      // Load existing or create new
      const existing = yield* Effect.tryPromise({
        try: async () => {
          try {
            const content = await readFile(guardrailsPath, "utf-8");
            return content;
          } catch {
            return null;
          }
        },
        catch: (error) =>
          new GuardrailsStoreError({
            message: `Failed to read guardrails file: ${guardrailsPath}`,
            operation: "add",
            cause: error,
          }),
      });

      let guardrails: GuardrailsFile;
      if (existing) {
        guardrails = yield* deserializeGuardrails(existing).pipe(
          Effect.mapError(
            (err) =>
              new GuardrailsStoreError({
                message: err.message,
                operation: "add",
                cause: err,
              })
          )
        );
      } else {
        const now = yield* DateTime.now;
        guardrails = createEmptyGuardrails(sessionId, DateTime.formatIso(now));
      }

      // Add the new guardrail (create new object since arrays are readonly)
      const updatedGuardrails: GuardrailsFile = {
        ...guardrails,
        guardrails: [...guardrails.guardrails, guardrail],
      };

      // Write back
      yield* Effect.tryPromise({
        try: () =>
          writeFile(
            guardrailsPath,
            serializeGuardrails(updatedGuardrails),
            "utf-8"
          ),
        catch: (error) =>
          new GuardrailsStoreError({
            message: `Failed to write guardrails file: ${guardrailsPath}`,
            operation: "add",
            cause: error,
          }),
      });
    }),

  load: (
    sessionId: string
  ): Effect.Effect<GuardrailsFile, GuardrailsStoreError> =>
    Effect.gen(function* () {
      const guardrailsPath = getGuardrailsPath(sessionId);

      const content = yield* Effect.tryPromise({
        try: async () => {
          try {
            return await readFile(guardrailsPath, "utf-8");
          } catch {
            // Return null for non-existent files
            return null;
          }
        },
        catch: (error) =>
          new GuardrailsStoreError({
            message: `Failed to read guardrails file: ${guardrailsPath}`,
            operation: "load",
            cause: error,
          }),
      });

      if (content === null) {
        // Return empty guardrails file if none exists
        const now = yield* DateTime.now;
        return createEmptyGuardrails(sessionId, DateTime.formatIso(now));
      }

      return yield* deserializeGuardrails(content);
    }),

  getActive: (
    sessionId: string
  ): Effect.Effect<readonly Guardrail[], GuardrailsStoreError> =>
    Effect.gen(function* () {
      const guardrails = yield* make.load(sessionId);
      // All guardrails are considered active (could add filtering logic later)
      return guardrails.guardrails;
    }),
};

/**
 * Live Layer for the file system guardrails store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const guardrailsStore = yield* GuardrailsStore;
 *   yield* guardrailsStore.add(sessionId, guardrail);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemGuardrails.Live)));
 * ```
 */
const Live = Layer.succeed(GuardrailsStore, make);

/**
 * FileSystemGuardrails namespace containing the Live layer.
 */
export const FileSystemGuardrails = {
  Live,
} as const;
