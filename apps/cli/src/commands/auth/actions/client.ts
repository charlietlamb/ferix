import { Data, Effect, Schema } from "effect";
import { CLI_CLIENT_ID, DEFAULT_AUTH_BASE_URL } from "../config.js";

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
    | "network_error";
  readonly cause?: unknown;
}> {}

/**
 * Response from the device code endpoint.
 */
export const DeviceCodeResponse = Schema.Struct({
  deviceCode: Schema.String,
  userCode: Schema.String,
  verificationUri: Schema.String,
  verificationUriComplete: Schema.optionalWith(Schema.String, {
    nullable: true,
  }),
  expiresIn: Schema.Number,
  interval: Schema.Number,
});

export type DeviceCodeResponse = Schema.Schema.Type<typeof DeviceCodeResponse>;

/**
 * Response from the device token endpoint on success.
 */
export const DeviceTokenResponse = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.optionalWith(Schema.String, { nullable: true }),
  expiresIn: Schema.optionalWith(Schema.Number, { nullable: true }),
  user: Schema.Struct({
    id: Schema.String,
    email: Schema.String,
  }),
});

export type DeviceTokenResponse = Schema.Schema.Type<
  typeof DeviceTokenResponse
>;

/**
 * Error response from the device token endpoint.
 */
export const DeviceTokenErrorResponse = Schema.Struct({
  error: Schema.String,
  error_description: Schema.optionalWith(Schema.String, { nullable: true }),
});

/**
 * Get the auth base URL from environment or default.
 */
export const getAuthBaseUrl = (): string =>
  process.env.FERIX_AUTH_URL ?? DEFAULT_AUTH_BASE_URL;

/**
 * Request a device code from the server.
 */
export const requestDeviceCode = (): Effect.Effect<
  DeviceCodeResponse,
  DeviceAuthError
> =>
  Effect.gen(function* () {
    const baseUrl = getAuthBaseUrl();
    const url = `${baseUrl}/device/code`;

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: CLI_CLIENT_ID }),
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
  deviceCode: string
): Effect.Effect<DeviceTokenResponse, DeviceAuthError> =>
  Effect.gen(function* () {
    const baseUrl = getAuthBaseUrl();
    const url = `${baseUrl}/device/token`;

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grantType: "urn:ietf:params:oauth:grant-type:device_code",
            deviceCode,
            clientId: CLI_CLIENT_ID,
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
      const errorResult = Schema.decodeUnknownSync(DeviceTokenErrorResponse)(
        json
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
