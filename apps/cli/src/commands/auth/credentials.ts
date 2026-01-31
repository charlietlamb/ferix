import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { Effect, Option, Schema } from "effect";
import {
  CredentialStoreError,
  type Credentials,
  CredentialsSchema,
} from "./types.js";

/**
 * XDG-compliant config directory for Ferix.
 * Uses XDG_CONFIG_HOME if set, otherwise ~/.config/ferix
 */
const getConfigDir = (): string => {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    return join(xdgConfig, "ferix");
  }
  return join(homedir(), ".config", "ferix");
};

/**
 * Path to the credentials file.
 */
const getCredentialsPath = (): string => {
  return join(getConfigDir(), "credentials.json");
};

/**
 * Load stored credentials from disk.
 * Returns None if no credentials exist.
 */
export const loadCredentials = (): Effect.Effect<
  Option.Option<Credentials>,
  CredentialStoreError
> => {
  return Effect.tryPromise({
    try: async () => {
      const path = getCredentialsPath();
      const content = await readFile(path, "utf-8");
      const parsed = JSON.parse(content) as unknown;
      const decoded = Schema.decodeUnknownSync(CredentialsSchema)(parsed);
      return Option.some(decoded);
    },
    catch: (error) => {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return new CredentialStoreError({
          message: "No credentials found",
          operation: "read",
        });
      }
      return new CredentialStoreError({
        message: "Failed to load credentials",
        operation: "read",
        cause: error,
      });
    },
  }).pipe(
    Effect.catchAll((error) => {
      if (
        error instanceof CredentialStoreError &&
        error.message === "No credentials found"
      ) {
        return Effect.succeed(Option.none<Credentials>());
      }
      return Effect.fail(error);
    })
  );
};

/**
 * Save credentials to disk.
 */
export const saveCredentials = (
  credentials: Credentials
): Effect.Effect<void, CredentialStoreError> => {
  return Effect.tryPromise({
    try: async () => {
      const path = getCredentialsPath();
      await mkdir(dirname(path), { recursive: true });
      const content = JSON.stringify(credentials, null, 2);
      await writeFile(path, content, { mode: 0o600 });
    },
    catch: (error) =>
      new CredentialStoreError({
        message: "Failed to save credentials",
        operation: "write",
        cause: error,
      }),
  });
};

/**
 * Delete stored credentials from disk.
 */
export const deleteCredentials = (): Effect.Effect<
  void,
  CredentialStoreError
> => {
  return Effect.tryPromise({
    try: async () => {
      const path = getCredentialsPath();
      await rm(path, { force: true });
    },
    catch: (error) =>
      new CredentialStoreError({
        message: "Failed to delete credentials",
        operation: "delete",
        cause: error,
      }),
  });
};

/**
 * Check if credentials are expired.
 */
export const isExpired = (credentials: Credentials): boolean => {
  const bufferMs = 60 * 1000;
  return Date.now() >= credentials.expiresAt - bufferMs;
};
