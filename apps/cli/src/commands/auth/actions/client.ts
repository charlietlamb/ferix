import { Data, Effect, Schema } from "effect";
import {
  CLI_CLIENT_ID,
  DEV_AUTH_BASE_URL,
  PROD_AUTH_BASE_URL,
} from "../config.js";

/**
 * Error that occurs during device authorization.
 */
export class DeviceAuthError extends Data.TaggedError("DeviceAuthError")<{
  readonly message: string;
  readonly code?:
    | "authorization_pending"
    | "slow_down"
    | "expired_token"
    | "access_denied"
    | "invalid_grant"
    | "network_error";
  readonly cause?: unknown;
}> {}

/**
 * Response from the device code endpoint.
 * Maps OAuth 2.0 snake_case response to camelCase for TypeScript usage.
 */
const DeviceCodeResponse = Schema.Struct({
  deviceCode: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("device_code")
  ),
  userCode: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("user_code")
  ),
  verificationUri: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("verification_uri")
  ),
  verificationUriComplete: Schema.optionalWith(Schema.String, {
    nullable: true,
  }).pipe(Schema.fromKey("verification_uri_complete")),
  expiresIn: Schema.propertySignature(Schema.Number).pipe(
    Schema.fromKey("expires_in")
  ),
  interval: Schema.Number,
});

type DeviceCodeResponse = Schema.Schema.Type<typeof DeviceCodeResponse>;

/**
 * Response from the device token endpoint on success.
 * Maps OAuth 2.0 snake_case response to camelCase for TypeScript usage.
 * Note: User info is not included in OAuth 2.0 device token response per RFC 8628.
 */
const DeviceTokenResponse = Schema.Struct({
  accessToken: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("access_token")
  ),
  refreshToken: Schema.optionalWith(Schema.String, { nullable: true }).pipe(
    Schema.fromKey("refresh_token")
  ),
  expiresIn: Schema.optionalWith(Schema.Number, { nullable: true }).pipe(
    Schema.fromKey("expires_in")
  ),
});

type DeviceTokenResponse = Schema.Schema.Type<typeof DeviceTokenResponse>;

/**
 * Response from the session endpoint containing user info.
 */
const UserSession = Schema.Struct({
  user: Schema.Struct({
    id: Schema.String,
    email: Schema.String,
  }),
});

/**
 * Error response from the device token endpoint.
 */
const DeviceTokenErrorResponse = Schema.Struct({
  error: Schema.String,
  error_description: Schema.optionalWith(Schema.String, { nullable: true }),
});

/**
 * Get the auth base URL based on dev flag.
 */
const getAuthBaseUrl = (dev: boolean): string =>
  dev ? DEV_AUTH_BASE_URL : PROD_AUTH_BASE_URL;

/**
 * Request a device code from the server.
 */
export const requestDeviceCode = (
  dev: boolean
): Effect.Effect<DeviceCodeResponse, DeviceAuthError> =>
  Effect.gen(function* () {
    const baseUrl = getAuthBaseUrl(dev);
    const url = `${baseUrl}/device/code`;

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: CLI_CLIENT_ID }),
        }),
      catch: (error) =>
        new DeviceAuthError({
          message: `Network error: ${String(error)}`,
          code: "network_error",
          cause: error,
        }),
    });

    if (!response.ok) {
      const text = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: () =>
          new DeviceAuthError({
            message: `Server returned ${response.status}`,
            code: "network_error",
          }),
      });
      return yield* Effect.fail(
        new DeviceAuthError({
          message: `Server error: ${text}`,
          code: "network_error",
        })
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (error) =>
        new DeviceAuthError({
          message: `Failed to parse response: ${String(error)}`,
          code: "network_error",
          cause: error,
        }),
    });

    const decoded = yield* Schema.decodeUnknown(DeviceCodeResponse)(json).pipe(
      Effect.mapError(
        (error) =>
          new DeviceAuthError({
            message: `Invalid response format: ${String(error)}`,
            code: "network_error",
            cause: error,
          })
      )
    );

    return decoded;
  });

/**
 * Poll for the access token.
 * Returns the token response on success, or an error indicating the state.
 */
export const pollForToken = (
  deviceCode: string,
  dev: boolean
): Effect.Effect<DeviceTokenResponse, DeviceAuthError> =>
  Effect.gen(function* () {
    const baseUrl = getAuthBaseUrl(dev);
    const url = `${baseUrl}/device/token`;

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            device_code: deviceCode,
            client_id: CLI_CLIENT_ID,
          }),
        }),
      catch: (error) =>
        new DeviceAuthError({
          message: `Network error: ${String(error)}`,
          code: "network_error",
          cause: error,
        }),
    });

    const json = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (error) =>
        new DeviceAuthError({
          message: `Failed to parse response: ${String(error)}`,
          code: "network_error",
          cause: error,
        }),
    });

    if (!response.ok) {
      const errorResult = yield* Schema.decodeUnknown(DeviceTokenErrorResponse)(
        json
      ).pipe(
        Effect.mapError(
          () =>
            new DeviceAuthError({
              message: `Server returned ${response.status}`,
              code: "network_error",
            })
        )
      );
      const errorCode = errorResult.error as DeviceAuthError["code"];

      return yield* Effect.fail(
        new DeviceAuthError({
          message: errorResult.error_description ?? errorResult.error,
          code: errorCode,
        })
      );
    }

    const decoded = yield* Schema.decodeUnknown(DeviceTokenResponse)(json).pipe(
      Effect.mapError(
        (error) =>
          new DeviceAuthError({
            message: `Invalid token response: ${String(error)}`,
            code: "network_error",
            cause: error,
          })
      )
    );

    return decoded;
  });

/**
 * Wait for the specified interval.
 */
export const waitInterval = (seconds: number): Effect.Effect<void, never> =>
  Effect.promise(
    () => new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  );

/**
 * Fetch user info from the session endpoint using the access token.
 */
export const fetchUserInfo = (
  accessToken: string,
  dev: boolean
): Effect.Effect<{ id: string; email: string }, DeviceAuthError> =>
  Effect.gen(function* () {
    const baseUrl = getAuthBaseUrl(dev);
    const url = `${baseUrl}/get-session`;

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      catch: (error) =>
        new DeviceAuthError({
          message: `Network error: ${String(error)}`,
          code: "network_error",
          cause: error,
        }),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new DeviceAuthError({
          message: `Failed to fetch user info: ${response.status}`,
          code: "network_error",
        })
      );
    }

    const json = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (error) =>
        new DeviceAuthError({
          message: `Failed to parse response: ${String(error)}`,
          code: "network_error",
          cause: error,
        }),
    });

    const decoded = yield* Schema.decodeUnknown(UserSession)(json).pipe(
      Effect.mapError(
        (error) =>
          new DeviceAuthError({
            message: `Invalid session response: ${String(error)}`,
            code: "network_error",
            cause: error,
          })
      )
    );

    return decoded.user;
  });
