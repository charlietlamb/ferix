import type { Command } from "commander";
import { printError } from "../../shared/ui.js";
import { runSyncCommand } from "./action.js";

/**
 * Register the sync command.
 */
export const registerSyncCommand = (program: Command): void => {
  program
    .command("sync")
    .description("Discover and install skills based on your dependencies")
    .option("-p, --path <path>", "Path to package.json", "./package.json")
    .option("-n, --dry-run", "List skills without installing")
    .option("-g, --global", "Install globally instead of project-level")
    .option("-d, --dev", "Use development server instead of production")
    .option(
      "-a, --agents <agents...>",
      "Specify agents to install to (auto-detects if not provided)"
    )
    .option("-y, --yes", "Skip selection prompt, install all repositories")
    .action(async (options) => {
      try {
        await runSyncCommand({
          path: options.path,
          dryRun: options.dryRun ?? false,
          global: options.global ?? false,
          dev: options.dev ?? false,
          agents: options.agents,
          yes: options.yes ?? false,
        });
      } catch (error) {
        console.log();
        printError(error instanceof Error ? error.message : String(error));
        console.log();
        process.exit(1);
      }
    });
};

export * from "./detect-agents.js";
export * from "./errors.js";
export * from "./find-skills.js";
export * from "./install-skills.js";
export * from "./resolve-orgs.js";
// Re-export types and functions for potential library usage
export * from "./types.js";
