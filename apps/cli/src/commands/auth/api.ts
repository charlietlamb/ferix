import { Effect, Schema } from "effect";
import {
  AuthError,
  DeviceCodeResponseSchema,
  type PollStatus,
  TokenResponseSchema,
} from "./types.js";

/**
 * Base URL for the Ferix API.
 */
const getBaseUrl = (dev?: boolean): string => {
  if (dev) {
    return "http://localhost:3003";
  }
  return "https://ferix.ai";
};

/**
 * Client ID for the CLI application.
 */
const CLI_CLIENT_ID = "ferix-cli";

/**
 * Request a device code for authentication.
 */
export const requestDeviceCode = (
  dev?: boolean
): Effect.Effect<
  {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string | null;
    expiresIn: number;
    interval: number;
  },
  AuthError
> => {
  const baseUrl = getBaseUrl(dev);
  const url = `${baseUrl}/api/auth/device/code`;

  return Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: CLI_CLIENT_ID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to request device code: ${errorText}`);
      }

      const data = (await response.json()) as unknown;
      const decoded = Schema.decodeUnknownSync(DeviceCodeResponseSchema)(data);

      return {
        deviceCode: decoded.deviceCode,
        userCode: decoded.userCode,
        verificationUri: decoded.verificationUri,
        verificationUriComplete:
          decoded.verificationUriComplete._tag === "Some"
            ? decoded.verificationUriComplete.value
            : null,
        expiresIn: decoded.expiresIn,
        interval: decoded.interval,
      };
    },
    catch: (error) =>
      new AuthError({
        message: error instanceof Error ? error.message : String(error),
        operation: "deviceCode",
        cause: error,
      }),
  });
};

/**
 * Poll for a token after user has authorized the device.
 */
export const pollForToken = (
  deviceCode: string,
  dev?: boolean
): Effect.Effect<PollStatus, AuthError> => {
  const baseUrl = getBaseUrl(dev);
  const url = `${baseUrl}/api/auth/device/token`;

  return Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: CLI_CLIENT_ID,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        const error = data.error;

        switch (error) {
          case "authorization_pending":
            return { type: "pending" as const };
          case "slow_down":
            return { type: "slowDown" as const };
          case "expired_token":
            return { type: "expired" as const };
          case "access_denied":
            return { type: "denied" as const };
          default:
            throw new Error(
              `Token polling failed: ${error || response.statusText}`
            );
        }
      }

      const data = (await response.json()) as unknown;
      const decoded = Schema.decodeUnknownSync(TokenResponseSchema)(data);

      return {
        type: "approved" as const,
        token: {
          accessToken: decoded.accessToken,
          refreshToken: decoded.refreshToken,
          expiresIn: decoded.expiresIn,
          tokenType: decoded.tokenType,
        },
      };
    },
    catch: (error) => {
      if (error instanceof AuthError) {
        throw error;
      }
      return new AuthError({
        message: error instanceof Error ? error.message : String(error),
        operation: "pollToken",
        cause: error,
      });
    },
  });
};

/**
 * Get user information using an access token.
 */
export const getUserInfo = (
  accessToken: string,
  dev?: boolean
): Effect.Effect<
  { id: string; email: string; username: string | null },
  AuthError
> => {
  const baseUrl = getBaseUrl(dev);
  const url = `${baseUrl}/api/auth/session`;

  return Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      const data = (await response.json()) as {
        user?: { id?: string; email?: string; username?: string | null };
      };
      const user = data.user;

      if (!(user?.id && user?.email)) {
        throw new Error("Invalid user info response");
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username ?? null,
      };
    },
    catch: (error) =>
      new AuthError({
        message: error instanceof Error ? error.message : String(error),
        operation: "status",
        cause: error,
      }),
  });
};
