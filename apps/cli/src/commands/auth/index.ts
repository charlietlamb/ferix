import type { Command } from "commander";
import { loginAction, logoutAction, statusAction } from "./actions/index.js";

/**
 * Register the auth command with subcommands for managing CLI authentication.
 *
 * @example
 * ```bash
 * # Login using device authorization flow
 * ferix auth login
 *
 * # Check authentication status
 * ferix auth status
 *
 * # Logout and clear credentials
 * ferix auth logout
 * ```
 */
export function registerAuthCommand(program: Command): void {
  const auth = program.command("auth").description("Manage CLI authentication");

  auth
    .command("login")
    .description("Authenticate with Ferix using device authorization")
    .action(async () => {
      await loginAction();
    });

  auth
    .command("logout")
    .description("Sign out and remove stored credentials")
    .action(async () => {
      await logoutAction();
    });

  auth
    .command("status")
    .description("Show current authentication status")
    .action(async () => {
      await statusAction();
    });
}

export * from "./actions/index.js";
export * from "./domain/index.js";
export * from "./layers/index.js";
export * from "./services/index.js";
