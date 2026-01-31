import { Effect, Option } from "effect";
import { isExpired, loadCredentials } from "./credentials.js";
import { AuthError, type Credentials } from "./types.js";

/**
 * Base URLs for the Ferix API.
 */
const FERIX_URL_PROD = "https://ferix.ai";
const FERIX_URL_DEV = "http://localhost:3003";

/**
 * Get the base URL for Ferix API.
 */
export const getFerixUrl = (dev?: boolean): string => {
  return dev ? FERIX_URL_DEV : FERIX_URL_PROD;
};

/**
 * Get valid credentials or fail with an error.
 */
export const getValidCredentials = (): Effect.Effect<Credentials, AuthError> =>
  Effect.gen(function* () {
    const maybeCredentials = yield* loadCredentials().pipe(
      Effect.mapError(
        (error) =>
          new AuthError({
            message: error.message,
            operation: "status",
            cause: error,
          })
      )
    );

    if (Option.isNone(maybeCredentials)) {
      return yield* Effect.fail(
        new AuthError({
          message: "Not authenticated. Run 'ferix auth login' first.",
          operation: "status",
        })
      );
    }

    const credentials = maybeCredentials.value;

    if (isExpired(credentials)) {
      return yield* Effect.fail(
        new AuthError({
          message:
            "Session expired. Run 'ferix auth login' to re-authenticate.",
          operation: "refresh",
        })
      );
    }

    return credentials;
  });

/**
 * Make an authenticated API request to the Ferix backend.
 */
export const fetchWithAuth = <T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    dev?: boolean;
  }
): Effect.Effect<T, AuthError> =>
  Effect.gen(function* () {
    const credentials = yield* getValidCredentials();
    const baseUrl = getFerixUrl(options?.dev);
    const url = `${baseUrl}${path}`;

    const response = yield* Effect.tryPromise({
      try: async () => {
        const fetchOptions: RequestInit = {
          method: options?.method ?? "GET",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
        };

        if (options?.body) {
          fetchOptions.body = JSON.stringify(options.body);
        }

        return await fetch(url, fetchOptions);
      },
      catch: (error) =>
        new AuthError({
          message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
          operation: "status",
          cause: error,
        }),
    });

    if (!response.ok) {
      const errorText = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: () =>
          new AuthError({
            message: `Request failed with status ${response.status}`,
            operation: "status",
          }),
      });

      return yield* Effect.fail(
        new AuthError({
          message: `Request failed: ${errorText}`,
          operation: "status",
        })
      );
    }

    const data = yield* Effect.tryPromise({
      try: () => response.json() as Promise<T>,
      catch: (error) =>
        new AuthError({
          message: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
          operation: "status",
          cause: error,
        }),
    });

    return data;
  });

/**
 * Check if user is authenticated with valid credentials.
 */
export const isAuthenticated = (): Effect.Effect<boolean, never> =>
  getValidCredentials().pipe(
    Effect.map(() => true),
    Effect.catchAll(() => Effect.succeed(false))
  );

/**
 * Get the current user's access token if authenticated.
 * Returns None if not authenticated or session expired.
 */
export const getAccessToken = (): Effect.Effect<Option.Option<string>, never> =>
  getValidCredentials().pipe(
    Effect.map((creds) => Option.some(creds.accessToken)),
    Effect.catchAll(() => Effect.succeed(Option.none<string>()))
  );
