import type { Command } from "commander";
import { runLogin, runLogout, runStatus } from "./actions/index.js";

/**
 * Register the auth command with subcommands.
 */
export const registerAuthCommand = (program: Command): void => {
  const auth = program
    .command("auth")
    .description("Manage Ferix CLI authentication");

  auth
    .command("login")
    .description("Authenticate with Ferix using device authorization")
    .action(async () => {
      await runLogin();
    });

  auth
    .command("logout")
    .description("Remove stored authentication credentials")
    .action(async () => {
      await runLogout();
    });

  auth
    .command("status")
    .description("Show current authentication status")
    .action(async () => {
      await runStatus();
    });
};

export * from "./actions/index.js";
export * from "./config.js";
