import type { Command } from "commander";
import { printError } from "../../shared/ui.js";
import {
  runLoginCommand,
  runLogoutCommand,
  runStatusCommand,
} from "./action.js";

/**
 * Register the auth command with login, logout, and status subcommands.
 */
export const registerAuthCommand = (program: Command): void => {
  const authCommand = program
    .command("auth")
    .description("Manage authentication for the Ferix CLI");

  authCommand
    .command("login")
    .description("Authenticate with Ferix using device code flow")
    .action(async () => {
      try {
        await runLoginCommand();
      } catch (error) {
        console.log();
        printError(error instanceof Error ? error.message : String(error));
        console.log();
        process.exit(1);
      }
    });

  authCommand
    .command("logout")
    .description("Sign out and clear stored credentials")
    .action(async () => {
      try {
        await runLogoutCommand();
      } catch (error) {
        console.log();
        printError(error instanceof Error ? error.message : String(error));
        console.log();
        process.exit(1);
      }
    });

  authCommand
    .command("status")
    .description("Display current authentication status")
    .action(async () => {
      try {
        await runStatusCommand();
      } catch (error) {
        console.log();
        printError(error instanceof Error ? error.message : String(error));
        console.log();
        process.exit(1);
      }
    });
};

export * from "./action.js";
export * from "./api.js";
export * from "./client.js";
export * from "./credentials.js";
export * from "./types.js";
