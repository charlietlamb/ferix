import { createProgram, parseOptions, runInteractive } from "./cli.js";
import { runLoop } from "./loop/runner.js";
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
      process.exit(0);
    }
  }

  // Run the loop
  try {
    await runLoop(config);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
