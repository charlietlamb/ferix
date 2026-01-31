import { Effect, Option } from "effect";
import pc from "picocolors";
import {
  createSpinner,
  printHeader,
  printHint,
  printSuccess,
} from "../../shared/ui.js";
import {
  deleteCredentials,
  isExpired,
  loadCredentials,
} from "./credentials.js";
import { AuthError } from "./types.js";

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
    spinner.fail("Device code flow not yet implemented");
    printHint("This feature is coming soon.");
    console.log();
  } catch (error) {
    spinner.fail("Login failed");
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
