import { createProgram, parseOptions, runInteractive } from "./cli.js";
import { loadConfig } from "./config/index.js";
import type { FerixFileConfig } from "./config/schema.js";
import { runLoop } from "./loop/runner.js";
import type { FerixConfig } from "./types/config.js";
import {
  AgentError,
  DependencyError,
  FerixError,
  UserCancelledError,
} from "./types/errors.js";
import { logger } from "./utils/logger.js";

/**
 * Merge file config with parsed CLI options, respecting CLI precedence.
 * Explicit CLI flags override config file values.
 */
function mergeConfigs(
  cliConfig: FerixConfig,
  fileConfig: FerixFileConfig,
  explicit: { verify: boolean; iterations: boolean; progress: boolean }
): FerixConfig {
  return {
    ...cliConfig,
    // Use CLI verify if explicitly set, otherwise use file config if present
    verify: explicit.verify
      ? cliConfig.verify
      : (fileConfig.verify ?? cliConfig.verify),
    // Use CLI iterations if explicitly set, otherwise use file config if present
    iterations: explicit.iterations
      ? cliConfig.iterations
      : (fileConfig.iterations ?? cliConfig.iterations),
    // Use CLI progress if explicitly set, otherwise use file config if present
    progress: explicit.progress
      ? cliConfig.progress
      : (fileConfig.progress ?? cliConfig.progress),
  };
}

async function main(): Promise<void> {
  // Load config file first (before parsing CLI to avoid side effects)
  const { config: fileConfig } = await loadConfig();

  const program = createProgram();
  program.parse(process.argv);

  const options = program.opts();
  const { config: cliConfig, explicit } = parseOptions(program, options);

  // If no task provided, run interactive mode
  if (!cliConfig) {
    const interactiveConfig = await runInteractive();
    if (!interactiveConfig) {
      // User cancelled in interactive mode
      throw new UserCancelledError();
    }
    // Run the loop with interactive config (no merge needed, user explicitly chose values)
    await runLoop(interactiveConfig);
    return;
  }

  // Merge CLI config with file config, respecting precedence
  const config = mergeConfigs(cliConfig, fileConfig, explicit);

  // Run the loop
  await runLoop(config);
}

/**
 * Handle errors and exit with appropriate code
 */
function handleError(error: unknown): never {
  // User cancelled - exit cleanly
  if (error instanceof UserCancelledError) {
    process.exit(0);
  }

  // Agent reported an error
  if (error instanceof AgentError) {
    logger.agentError(error.errorType, error.message);
    process.exit(error.exitCode);
  }

  // Dependency not available
  if (error instanceof DependencyError) {
    logger.error(error.message);
    if (error.installHint) {
      logger.dim(error.installHint);
    }
    process.exit(error.exitCode);
  }

  // Other Ferix errors
  if (error instanceof FerixError) {
    logger.error(error.message);
    process.exit(error.exitCode);
  }

  // Unknown errors
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

main().catch(handleError);
