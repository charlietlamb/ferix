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
    .action(async (_options: Record<string, unknown>, cmd: Command) => {
      // Read --dev from root program options
      const rootOpts = cmd.parent?.parent?.opts() as
        | { dev?: boolean }
        | undefined;
      await runLogin(rootOpts?.dev ?? false);
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
