import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { DateTime, Effect, Layer, Option, Schema } from "effect";
import {
  type AuthStatus,
  type Credentials,
  CredentialsFile,
  CredentialsStoreError,
} from "../domain/index.js";
import {
  CredentialsStore,
  type CredentialsStoreService,
} from "../services/credentials-store.js";

/**
 * Path to the credentials file in the user's home directory.
 */
const CREDENTIALS_PATH = join(homedir(), ".ferix", "credentials.json");

/**
 * Ensures the parent directory exists for the credentials file.
 */
function ensureCredentialsDir(): Effect.Effect<void, CredentialsStoreError> {
  return Effect.tryPromise({
    try: () => mkdir(dirname(CREDENTIALS_PATH), { recursive: true }),
    catch: (error) =>
      new CredentialsStoreError({
        message: `Failed to create credentials directory: ${dirname(CREDENTIALS_PATH)}`,
        operation: "write",
        cause: error,
      }),
  }).pipe(Effect.asVoid);
}

/**
 * Serializes a credentials file to JSON string.
 */
function serializeCredentials(file: CredentialsFile): string {
  const serialized = {
    version: file.version,
    credentials: {
      accessToken: file.credentials.accessToken,
      refreshToken: Option.getOrUndefined(file.credentials.refreshToken),
      expiresAt: Option.getOrUndefined(file.credentials.expiresAt),
      userId: Option.getOrUndefined(file.credentials.userId),
      email: Option.getOrUndefined(file.credentials.email),
      name: Option.getOrUndefined(file.credentials.name),
    },
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
  return JSON.stringify(serialized, null, 2);
}

/**
 * Parses and validates credentials from JSON.
 */
function parseCredentialsFile(
  json: string
): Effect.Effect<CredentialsFile, CredentialsStoreError> {
  return Effect.gen(function* () {
    const parsed = yield* Effect.try({
      try: () => JSON.parse(json) as unknown,
      catch: (error) =>
        new CredentialsStoreError({
          message: `Invalid JSON in credentials file: ${String(error)}`,
          operation: "read",
          cause: error,
        }),
    });

    const validated = yield* Schema.decodeUnknown(CredentialsFile)(parsed).pipe(
      Effect.mapError(
        (error) =>
          new CredentialsStoreError({
            message: `Credentials validation failed: ${String(error)}`,
            operation: "read",
            cause: error,
          })
      )
    );

    return validated;
  });
}

/**
 * Checks if credentials have expired.
 */
function isExpired(credentials: Credentials): boolean {
  return Option.match(credentials.expiresAt, {
    onNone: () => false,
    onSome: (expiresAt) => Date.now() > expiresAt,
  });
}

/**
 * File system credentials store implementation.
 *
 * Stores credentials in ~/.ferix/credentials.json
 */
const make: CredentialsStoreService = {
  save: (
    credentials: Credentials
  ): Effect.Effect<void, CredentialsStoreError> =>
    Effect.gen(function* () {
      yield* ensureCredentialsDir();

      const now = yield* DateTime.now;
      const nowIso = DateTime.formatIso(now);

      // Try to load existing to preserve createdAt
      const existing = yield* Effect.tryPromise({
        try: async () => {
          try {
            const content = await readFile(CREDENTIALS_PATH, "utf-8");
            return content;
          } catch {
            return null;
          }
        },
        catch: (error) =>
          new CredentialsStoreError({
            message: `Failed to read existing credentials: ${String(error)}`,
            operation: "write",
            cause: error,
          }),
      });

      let createdAt = nowIso;
      if (existing) {
        const parsed = yield* parseCredentialsFile(existing).pipe(
          Effect.catchAll(() => Effect.succeed(null))
        );
        if (parsed) {
          createdAt = parsed.createdAt;
        }
      }

      const file: CredentialsFile = {
        version: 1,
        credentials,
        createdAt,
        updatedAt: nowIso,
      };

      yield* Effect.tryPromise({
        try: () =>
          writeFile(CREDENTIALS_PATH, serializeCredentials(file), {
            encoding: "utf-8",
            mode: 0o600, // Secure file permissions
          }),
        catch: (error) =>
          new CredentialsStoreError({
            message: `Failed to write credentials file: ${String(error)}`,
            operation: "write",
            cause: error,
          }),
      });
    }),

  load: (): Effect.Effect<Credentials, CredentialsStoreError> =>
    Effect.gen(function* () {
      const content = yield* Effect.tryPromise({
        try: () => readFile(CREDENTIALS_PATH, "utf-8"),
        catch: (error) =>
          new CredentialsStoreError({
            message:
              "No credentials found. Please run 'ferix auth login' to authenticate.",
            operation: "read",
            cause: error,
          }),
      });

      const file = yield* parseCredentialsFile(content);
      return file.credentials;
    }),

  clear: (): Effect.Effect<void, CredentialsStoreError> =>
    Effect.tryPromise({
      try: async () => {
        try {
          await unlink(CREDENTIALS_PATH);
        } catch (error) {
          // Ignore if file doesn't exist
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }
      },
      catch: (error) =>
        new CredentialsStoreError({
          message: `Failed to delete credentials file: ${String(error)}`,
          operation: "delete",
          cause: error,
        }),
    }),

  getStatus: (): Effect.Effect<AuthStatus, CredentialsStoreError> =>
    Effect.gen(function* () {
      const loadResult = yield* make.load().pipe(
        Effect.map((credentials) => ({ found: true as const, credentials })),
        Effect.catchAll(() =>
          Effect.succeed({ found: false as const, credentials: null })
        )
      );

      if (!(loadResult.found && loadResult.credentials)) {
        return { status: "unauthenticated" as const };
      }

      const credentials = loadResult.credentials;

      if (isExpired(credentials)) {
        return { status: "expired" as const, credentials };
      }

      return { status: "authenticated" as const, credentials };
    }),
};

/**
 * Live Layer for the file system credentials store.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const store = yield* CredentialsStore;
 *   const status = yield* store.getStatus();
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(FileSystemCredentials.Live)));
 * ```
 */
const Live = Layer.succeed(CredentialsStore, make);

/**
 * FileSystemCredentials namespace containing the Live layer.
 */
export const FileSystemCredentials = {
  Live,
} as const;
