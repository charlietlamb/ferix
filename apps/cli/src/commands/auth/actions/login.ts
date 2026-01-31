import { Effect, Option } from "effect";
import ora from "ora";
import pc from "picocolors";
import { authConfig } from "../config.js";
import { type Credentials, DeviceAuthError } from "../domain/index.js";
import { FileSystemCredentials } from "../layers/index.js";
import { CredentialsStore } from "../services/index.js";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Request a device code from the auth server.
 */
function requestDeviceCode(): Effect.Effect<
  DeviceCodeResponse,
  DeviceAuthError
> {
  return Effect.tryPromise({
    try: async () => {
      const response = await fetch(
        `${authConfig.apiUrl}/api/auth/device/code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: authConfig.clientId,
            scope: "openid profile email",
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Device code request failed: ${response.status} ${text}`
        );
      }

      return (await response.json()) as DeviceCodeResponse;
    },
    catch: (error) =>
      new DeviceAuthError({
        message: `Failed to request device code: ${String(error)}`,
        code: "network_error",
        cause: error,
      }),
  });
}

/**
 * Poll for the access token after user authorization.
 */
function pollForToken(
  deviceCode: string,
  interval: number,
  expiresAt: number
): Effect.Effect<TokenResponse, DeviceAuthError> {
  const poll = (): Effect.Effect<TokenResponse, DeviceAuthError> =>
    Effect.gen(function* () {
      if (Date.now() > expiresAt) {
        return yield* Effect.fail(
          new DeviceAuthError({
            message: "Device code expired. Please try again.",
            code: "expired_token",
          })
        );
      }

      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetch(
            `${authConfig.apiUrl}/api/auth/device/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                device_code: deviceCode,
                client_id: authConfig.clientId,
              }),
            }
          );

          const data = (await response.json()) as
            | TokenResponse
            | TokenErrorResponse;

          if (!response.ok) {
            return { error: data as TokenErrorResponse };
          }

          return { success: data as TokenResponse };
        },
        catch: (error) =>
          new DeviceAuthError({
            message: `Failed to poll for token: ${String(error)}`,
            code: "network_error",
            cause: error,
          }),
      });

      if ("error" in result) {
        const errorResponse = result.error;

        switch (errorResponse.error) {
          case "authorization_pending":
            yield* Effect.sleep(`${interval} seconds`);
            return yield* poll();

          case "slow_down":
            yield* Effect.sleep(`${interval + 5} seconds`);
            return yield* poll();

          case "access_denied":
            return yield* Effect.fail(
              new DeviceAuthError({
                message: "Authorization was denied by the user.",
                code: "access_denied",
              })
            );

          case "expired_token":
            return yield* Effect.fail(
              new DeviceAuthError({
                message: "Device code expired. Please try again.",
                code: "expired_token",
              })
            );

          default:
            return yield* Effect.fail(
              new DeviceAuthError({
                message:
                  errorResponse.error_description ??
                  `Authorization failed: ${errorResponse.error}`,
                code: "unknown",
              })
            );
        }
      }

      return result.success;
    });

  return poll();
}

/**
 * Get the platform-specific command to open a URL.
 */
function getBrowserCommand(url: string): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return `open "${url}"`;
  }
  if (platform === "win32") {
    return `start "${url}"`;
  }
  return `xdg-open "${url}"`;
}

/**
 * Open a URL in the default browser.
 */
async function openBrowser(url: string): Promise<void> {
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);

  const command = getBrowserCommand(url);

  try {
    await execAsync(command);
  } catch {
    // Browser open failed, user will need to manually visit URL
  }
}

/**
 * Execute the login flow using device authorization.
 */
export async function loginAction(): Promise<void> {
  const spinner = ora();

  const program = Effect.gen(function* () {
    const store = yield* CredentialsStore;

    // Check if already logged in
    const status = yield* store.getStatus();
    if (status.status === "authenticated") {
      const email = Option.getOrElse(status.credentials.email, () => "unknown");
      console.log(pc.yellow(`Already logged in as ${email}`));
      console.log(pc.dim("Run 'ferix auth logout' to sign out first."));
      return;
    }

    spinner.start("Requesting device authorization...");

    // Request device code
    const deviceCode = yield* requestDeviceCode();

    spinner.stop();

    // Display authorization instructions
    console.log();
    console.log(pc.bold("Device Authorization"));
    console.log();
    console.log(`Visit: ${pc.cyan(deviceCode.verification_uri)}`);
    console.log(`Enter code: ${pc.bold(pc.green(deviceCode.user_code))}`);
    console.log();

    // Try to open browser
    const urlToOpen =
      deviceCode.verification_uri_complete ?? deviceCode.verification_uri;
    yield* Effect.promise(() => openBrowser(urlToOpen));
    console.log(pc.dim("Opening browser..."));
    console.log();

    spinner.start("Waiting for authorization...");

    const expiresAt = Date.now() + deviceCode.expires_in * 1000;

    // Poll for token
    const token = yield* pollForToken(
      deviceCode.device_code,
      deviceCode.interval,
      expiresAt
    );

    spinner.text = "Saving credentials...";

    // Save credentials
    const credentials: Credentials = {
      accessToken: token.access_token,
      refreshToken: Option.fromNullable(token.refresh_token),
      expiresAt: token.expires_in
        ? Option.some(Date.now() + token.expires_in * 1000)
        : Option.none(),
      userId: Option.none(),
      email: Option.none(),
      name: Option.none(),
    };

    yield* store.save(credentials);

    spinner.succeed(pc.green("Successfully logged in!"));
  });

  const result = await Effect.runPromiseExit(
    program.pipe(Effect.provide(FileSystemCredentials.Live))
  );

  if (result._tag === "Failure") {
    spinner.fail(pc.red("Login failed"));

    const cause = result.cause;
    if (cause._tag === "Fail") {
      const error = cause.error;
      if (error instanceof DeviceAuthError) {
        console.error(pc.red(error.message));
      } else {
        console.error(pc.red(String(error)));
      }
    } else {
      console.error(pc.red("An unexpected error occurred"));
    }

    process.exit(1);
  }
}
