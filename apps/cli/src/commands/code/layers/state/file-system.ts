import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { StateStoreError } from "../../domain/errors.js";
import {
  decodeSessionState,
  type SessionState,
} from "../../domain/schemas/state.js";
import {
  StateStore,
  type StateStoreService,
} from "../../services/state-store.js";

/**
 * Base directory for plan storage (global, in user's home directory).
 */
const PLANS_DIR = ".ferix/plans";

/**
 * Ensures a directory exists, creating it if necessary.
 */
function ensureDir(dirPath: string): Effect.Effect<void, StateStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirPath, { recursive: true }),
    catch: (error) =>
      new StateStoreError({
        message: `Failed to create directory: ${dirPath}`,
        operation: "write",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Gets the directory path for a session's plans.
 */
function getSessionDir(sessionId: string): string {
  return join(homedir(), PLANS_DIR, sessionId);
}

/**
 * Gets the file path for a session's STATE.json.
 */
function getStatePath(sessionId: string): string {
  return join(getSessionDir(sessionId), "STATE.json");
}

/**
 * Serializes session state to JSON string.
 */
function serializeState(state: SessionState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Deserializes and validates session state from JSON string.
 */
function deserializeState(
  json: string
): Effect.Effect<SessionState, StateStoreError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (error) =>
        new StateStoreError({
          message: `Invalid JSON in STATE.json: ${String(error)}`,
          operation: "read",
          cause: error,
        }),
    });

    const validated = yield* decodeSessionState(parsed).pipe(
      Effect.mapError(
        (error) =>
          new StateStoreError({
            message: `STATE.json validation failed: ${String(error)}`,
            operation: "read",
            cause: error,
          })
      )
    );

    return validated;
  });
}

/**
 * File system state store service implementation.
 *
 * Stores session state as JSON in `.ferix/plans/:sessionId/STATE.json`.
 */
const make: StateStoreService = {
  write: (
    sessionId: string,
    state: SessionState
  ): Effect.Effect<void, StateStoreError> =>
    Effect.gen(function* () {
      const sessionDir = getSessionDir(sessionId);
      yield* ensureDir(sessionDir);

      const statePath = getStatePath(sessionId);

      yield* Effect.tryPromise({
        try: () => writeFile(statePath, serializeState(state), "utf-8"),
        catch: (error) =>
          new StateStoreError({
            message: `Failed to write STATE.json: ${statePath}`,
            operation: "write",
            cause: error,
          }),
      });
    }),

  read: (sessionId: string): Effect.Effect<SessionState, StateStoreError> =>
    Effect.gen(function* () {
      const statePath = getStatePath(sessionId);

      const content = yield* Effect.tryPromise({
        try: () => readFile(statePath, "utf-8"),
        catch: (error) =>
          new StateStoreError({
            message: `Failed to read STATE.json: ${statePath}`,
            operation: "read",
            cause: error,
          }),
      });

      return yield* deserializeState(content);
    }),
};

/**
 * Live Layer for the file system state store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const stateStore = yield* StateStore;
 *   yield* stateStore.write(sessionId, state);
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemState.Live)));
 * ```
 */
const Live = Layer.succeed(StateStore, make);

/**
 * FileSystemState namespace containing the Live layer.
 */
export const FileSystemState = {
  Live,
} as const;
