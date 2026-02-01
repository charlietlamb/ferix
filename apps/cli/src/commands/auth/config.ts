import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { Data, Effect, Schema } from "effect";

/**
 * Client ID used by the CLI for device authorization.
 */
export const CLI_CLIENT_ID = "ferix-cli";

/**
 * Production auth server URL.
 */
export const PROD_AUTH_BASE_URL = "https://ferix.ai/api/auth";

/**
 * Development auth server URL (local).
 */
export const DEV_AUTH_BASE_URL = "http://localhost:3003/api/auth";

/**
 * Path to the credentials file in the user's home directory.
 */
export const getCredentialsPath = (): string =>
  join(homedir(), ".ferix", "credentials.json");

/**
 * Error that occurs during credential storage operations.
 */
class CredentialError extends Data.TaggedError("CredentialError")<{
  readonly message: string;
  readonly operation: "read" | "write" | "delete";
  readonly cause?: unknown;
}> {}

/**
 * Schema for stored credentials.
 */
export const StoredCredentials = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.optionalWith(Schema.String, { nullable: true }),
  expiresAt: Schema.optionalWith(Schema.Number, { nullable: true }),
  userId: Schema.String,
  email: Schema.String,
});

export type StoredCredentials = Schema.Schema.Type<typeof StoredCredentials>;

/**
 * Read credentials from the file system.
 * Returns undefined if credentials don't exist.
 */
export const readCredentials = (): Effect.Effect<
  StoredCredentials | undefined,
  CredentialError
> =>
  Effect.gen(function* () {
    const credentialsPath = getCredentialsPath();

    const fileContent = yield* Effect.tryPromise({
      try: () => readFile(credentialsPath, "utf-8"),
      catch: (error) =>
        new CredentialError({
          message: `Failed to read credentials: ${String(error)}`,
          operation: "read",
          cause: error,
        }),
    }).pipe(
      Effect.catchIf(
        (error) => (error.cause as NodeJS.ErrnoException)?.code === "ENOENT",
        () => Effect.succeed(undefined)
      )
    );

    if (fileContent === undefined) {
      return undefined;
    }

    const parsed = yield* Effect.try({
      try: () => JSON.parse(fileContent as string) as unknown,
      catch: (error) =>
        new CredentialError({
          message: `Failed to parse credentials JSON: ${String(error)}`,
          operation: "read",
          cause: error,
        }),
    });

    const decoded = yield* Schema.decodeUnknown(StoredCredentials)(parsed).pipe(
      Effect.mapError(
        (error) =>
          new CredentialError({
            message: `Invalid credentials format: ${String(error)}`,
            operation: "read",
            cause: error,
          })
      )
    );

    return decoded;
  });

/**
 * Write credentials to the file system.
 */
export const writeCredentials = (
  credentials: StoredCredentials
): Effect.Effect<void, CredentialError> =>
  Effect.gen(function* () {
    const credentialsPath = getCredentialsPath();

    yield* Effect.tryPromise({
      try: () => mkdir(dirname(credentialsPath), { recursive: true }),
      catch: (error) =>
        new CredentialError({
          message: `Failed to create credentials directory: ${String(error)}`,
          operation: "write",
          cause: error,
        }),
    });

    const content = JSON.stringify(credentials, null, 2);

    yield* Effect.tryPromise({
      try: () => writeFile(credentialsPath, content, { mode: 0o600 }),
      catch: (error) =>
        new CredentialError({
          message: `Failed to write credentials: ${String(error)}`,
          operation: "write",
          cause: error,
        }),
    });
  });

/**
 * Delete credentials from the file system.
 */
export const deleteCredentials = (): Effect.Effect<void, CredentialError> =>
  Effect.tryPromise({
    try: async () => {
      const credentialsPath = getCredentialsPath();
      await unlink(credentialsPath);
    },
    catch: (error) =>
      new CredentialError({
        message: `Failed to delete credentials: ${String(error)}`,
        operation: "delete",
        cause: error,
      }),
  }).pipe(
    Effect.catchIf(
      (error) => (error.cause as NodeJS.ErrnoException)?.code === "ENOENT",
      () => Effect.void
    )
  );
