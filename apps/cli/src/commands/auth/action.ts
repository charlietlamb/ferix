import { exec } from "node:child_process";
import { platform } from "node:os";
import { promisify } from "node:util";
import { Effect, Option } from "effect";
import pc from "picocolors";
import {
  createSpinner,
  printHeader,
  printHint,
  printSuccess,
} from "../../shared/ui.js";
import { getUserInfo, pollForToken, requestDeviceCode } from "./api.js";
import {
  deleteCredentials,
  isExpired,
  loadCredentials,
  saveCredentials,
} from "./credentials.js";
import { AuthError, type Credentials, type PollStatus } from "./types.js";

const execAsync = promisify(exec);

/**
 * Open a URL in the default browser.
 */
const openBrowser = async (url: string): Promise<void> => {
  const os = platform();
  let command: string;

  switch (os) {
    case "darwin":
      command = `open "${url}"`;
      break;
    case "win32":
      command = `start "" "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
  }

  await execAsync(command);
};

/**
 * Sleep for a given number of milliseconds.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run the login command using device code flow.
 * Opens a browser for the user to authenticate, then polls for token.
 */
export const runLoginCommand = async (): Promise<void> => {
  printHeader("Ferix Login", "Authenticate using device code flow");

  const existingCredentials = await Effect.runPromise(loadCredentials());
  if (
    Option.isSome(existingCredentials) &&
    !isExpired(existingCredentials.value)
  ) {
    printSuccess(
      `Already logged in as ${pc.cyan(existingCredentials.value.email)}`
    );
    printHint("Use 'ferix auth logout' to sign out first.");
    console.log();
    return;
  }

  const spinner = createSpinner("Requesting device code...").start();

  try {
    const deviceCode = await Effect.runPromise(requestDeviceCode());

    spinner.succeed("Device code received");
    console.log();
    console.log(
      `  ${pc.bold("Open this URL in your browser:")} ${pc.cyan(deviceCode.verificationUri)}`
    );
    console.log();
    console.log(
      `  ${pc.bold("Enter this code:")} ${pc.bold(pc.green(deviceCode.userCode))}`
    );
    console.log();

    try {
      await openBrowser(
        deviceCode.verificationUriComplete || deviceCode.verificationUri
      );
      printHint("A browser window should have opened automatically.");
    } catch {
      printHint("Please open the URL above manually in your browser.");
    }
    console.log();

    const pollSpinner = createSpinner("Waiting for authorization...").start();

    let interval = deviceCode.interval * 1000;
    const expiresAt = Date.now() + deviceCode.expiresIn * 1000;
    let status: PollStatus = { type: "pending" };

    while (Date.now() < expiresAt && status.type === "pending") {
      await sleep(interval);

      status = await Effect.runPromise(pollForToken(deviceCode.deviceCode));

      switch (status.type) {
        case "pending":
          break;
        case "slowDown":
          interval = Math.min(interval * 2, 30_000);
          status = { type: "pending" };
          break;
        case "approved":
          pollSpinner.succeed("Authorization successful");
          break;
        case "denied":
          pollSpinner.fail("Authorization denied by user");
          console.log();
          return;
        case "expired":
          pollSpinner.fail("Device code expired");
          printHint("Please try again with 'ferix auth login'.");
          console.log();
          return;
        default: {
          const exhaustiveCheck: never = status;
          throw new Error(
            `Unexpected status: ${JSON.stringify(exhaustiveCheck)}`
          );
        }
      }
    }

    if (status.type !== "approved") {
      pollSpinner.fail("Authorization timed out");
      printHint("Please try again with 'ferix auth login'.");
      console.log();
      return;
    }

    const saveSpinner = createSpinner("Saving credentials...").start();

    const userInfo = await Effect.runPromise(
      getUserInfo(status.token.accessToken)
    );

    const credentials: Credentials = {
      accessToken: status.token.accessToken,
      refreshToken:
        status.token.refreshToken._tag === "Some"
          ? Option.some(status.token.refreshToken.value)
          : Option.none(),
      expiresAt: Date.now() + status.token.expiresIn * 1000,
      userId: userInfo.id,
      email: userInfo.email,
      username: userInfo.username
        ? Option.some(userInfo.username)
        : Option.none(),
    };

    await Effect.runPromise(saveCredentials(credentials));

    saveSpinner.succeed("Credentials saved");
    console.log();
    printSuccess(`Logged in as ${pc.cyan(userInfo.email)}`);
    if (userInfo.username) {
      printHint(`Username: ${pc.cyan(userInfo.username)}`);
    }
    console.log();
  } catch (error) {
    throw new AuthError({
      message: error instanceof Error ? error.message : String(error),
      operation: "login",
      cause: error,
    });
  }
};

/**
 * Run the logout command to clear stored credentials.
 */
export const runLogoutCommand = async (): Promise<void> => {
  printHeader("Ferix Logout", "Sign out and clear credentials");

  const spinner = createSpinner("Checking authentication status...").start();

  const existingCredentials = await Effect.runPromise(loadCredentials());
  if (Option.isNone(existingCredentials)) {
    spinner.info("Not currently logged in");
    console.log();
    return;
  }

  spinner.text = "Signing out...";

  await Effect.runPromise(deleteCredentials());

  spinner.succeed("Signed out successfully");
  printHint("You can sign in again with 'ferix auth login'.");
  console.log();
};

/**
 * Run the status command to display current authentication state.
 */
export const runStatusCommand = async (): Promise<void> => {
  printHeader("Ferix Auth Status", "Current authentication state");

  const spinner = createSpinner("Checking credentials...").start();

  const credentials = await Effect.runPromise(loadCredentials());

  if (Option.isNone(credentials)) {
    spinner.info("Not logged in");
    printHint("Use 'ferix auth login' to authenticate.");
    console.log();
    return;
  }

  const creds = credentials.value;
  const expired = isExpired(creds);

  if (expired) {
    spinner.warn("Session expired");
    console.log();
    console.log(`  ${pc.dim("Email:")} ${creds.email}`);
    if (Option.isSome(creds.username)) {
      console.log(`  ${pc.dim("Username:")} ${creds.username.value}`);
    }
    console.log(`  ${pc.dim("Status:")} ${pc.yellow("Expired")}`);
    printHint("Use 'ferix auth login' to re-authenticate.");
  } else {
    spinner.succeed("Authenticated");
    console.log();
    console.log(`  ${pc.dim("Email:")} ${pc.cyan(creds.email)}`);
    if (Option.isSome(creds.username)) {
      console.log(`  ${pc.dim("Username:")} ${pc.cyan(creds.username.value)}`);
    }
    const expiresIn = Math.round((creds.expiresAt - Date.now()) / 1000 / 60);
    console.log(`  ${pc.dim("Expires in:")} ${expiresIn} minutes`);
  }
  console.log();
};
