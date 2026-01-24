import { Command } from "commander";
import packageJson from "../package.json" with { type: "json" };
import type { LoopConfig } from "./domain/index.js";
import { main } from "./program.js";

const program = new Command();

program
  .name("ferix-code")
  .description("Composable RALPH loops for AI coding agents")
  .version(packageJson.version)
  .argument("<task>", "Task description or path to PRD file")
  .option("-i, --iterations <n>", "Maximum iterations", "1")
  .option("-v, --verify <commands...>", "Verification commands")
  .option("--branch <name>", "Git branch to create")
  .option("--push", "Push branch after completion")
  .option("--pr", "Create PR after pushing")
  .action(async (task: string, options) => {
    const config: LoopConfig = {
      task,
      maxIterations: Number.parseInt(options.iterations, 10),
      verifyCommands: options.verify || [],
      branch: options.branch,
      push: options.push,
      pr: options.pr,
    };

    try {
      await main(config);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();

export * from "./consumers/index.js";
export * from "./domain/index.js";
export * from "./layers/index.js";
export * from "./orchestrator/index.js";
export {
  collectEvents,
  main,
  type RunOptions,
  run,
  runTest,
} from "./program.js";
export * from "./services/index.js";
