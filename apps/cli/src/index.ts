import { createProgram, parseOptions, runInteractive } from "./cli.js";
import { runLoop } from "./loop/runner.js";
import {
  AgentError,
  DependencyError,
  FerixError,
  UserCancelledError,
} from "./types/errors.js";
import { logger } from "./utils/logger.js";

async function main(): Promise<void> {
  const program = createProgram();
  program.parse(process.argv);

  const options = program.opts();
  let config = parseOptions(options);

  // If no task provided, run interactive mode
  if (!config) {
    config = await runInteractive();
    if (!config) {
      // User cancelled in interactive mode
      throw new UserCancelledError();
    }
  }

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
