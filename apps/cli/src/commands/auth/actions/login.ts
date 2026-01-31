import { Effect } from "effect";
import pc from "picocolors";
import { createSpinner, printError, printSuccess } from "../../../shared/ui.js";
import {
  readCredentials,
  type StoredCredentials,
  writeCredentials,
} from "../config.js";
import {
  DeviceAuthError,
  pollForToken,
  requestDeviceCode,
  waitInterval,
} from "./client.js";

const MAX_POLL_ATTEMPTS = 360;

/**
 * Run the device authorization login flow.
 */
export const runLogin = async (): Promise<void> => {
  const result = await Effect.runPromise(loginEffect().pipe(Effect.either));

  if (result._tag === "Left") {
    const error = result.left;
    if (error instanceof DeviceAuthError) {
      printError(error.message);
    } else {
      printError(String(error));
    }
    process.exit(1);
  }
};

const loginEffect = () =>
  Effect.gen(function* () {
    const existingCredentials = yield* readCredentials().pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );

    if (existingCredentials) {
      console.log();
      console.log(
        pc.yellow("  You are already logged in as ") +
          pc.bold(existingCredentials.email)
      );
      console.log(pc.dim("  Run 'ferix auth logout' to log out first"));
      console.log();
      return;
    }

    console.log();
    console.log(pc.bold(pc.cyan("  Ferix CLI Authentication")));
    console.log();

    const spinner = createSpinner("Requesting device code...");
    spinner.start();

    const deviceCode = yield* requestDeviceCode().pipe(
      Effect.tapError(() => Effect.sync(() => spinner.stop()))
    );

    spinner.stop();

    console.log(
      pc.bold("  Please visit: ") + pc.cyan(deviceCode.verificationUri)
    );
    console.log();
    console.log(
      pc.bold("  Enter code: ") + pc.yellow(pc.bold(deviceCode.userCode))
    );
    console.log();

    const pollSpinner = createSpinner("Waiting for authorization...");
    pollSpinner.start();

    const tokenResponse = yield* pollForTokenWithRetry(
      deviceCode.deviceCode,
      deviceCode.interval,
      pollSpinner
    );

    pollSpinner.stop();

    const credentials: StoredCredentials = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken ?? null,
      expiresAt: tokenResponse.expiresIn
        ? Date.now() + tokenResponse.expiresIn * 1000
        : null,
      userId: tokenResponse.user.id,
      email: tokenResponse.user.email,
    };

    yield* writeCredentials(credentials);

    console.log();
    printSuccess(`Logged in as ${pc.bold(tokenResponse.user.email)}`);
    console.log();
  });

const pollForTokenWithRetry = (
  deviceCode: string,
  interval: number,
  spinner: ReturnType<typeof createSpinner>
) =>
  Effect.gen(function* () {
    let attempts = 0;
    let currentInterval = interval;

    while (attempts < MAX_POLL_ATTEMPTS) {
      yield* waitInterval(currentInterval);

      const result = yield* pollForToken(deviceCode).pipe(Effect.either);

      if (result._tag === "Right") {
        return result.right;
      }

      const error = result.left;

      if (error.code === "authorization_pending") {
        attempts++;
        continue;
      }

      if (error.code === "slow_down") {
        currentInterval += 5;
        attempts++;
        continue;
      }

      if (error.code === "expired_token") {
        spinner.stop();
        return yield* Effect.fail(
          new DeviceAuthError({
            message: "Device code expired. Please try again.",
            code: "expired_token",
          })
        );
      }

      if (error.code === "access_denied") {
        spinner.stop();
        return yield* Effect.fail(
          new DeviceAuthError({
            message: "Authorization was denied.",
            code: "access_denied",
          })
        );
      }

      spinner.stop();
      return yield* Effect.fail(error);
    }

    spinner.stop();
    return yield* Effect.fail(
      new DeviceAuthError({
        message: "Authorization timed out. Please try again.",
        code: "expired_token",
      })
    );
  });
