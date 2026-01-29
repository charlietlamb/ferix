import type { Command } from "commander";
import { main } from "./action.js";
import type { LoopConfig, ProviderName } from "./domain/index.js";

/**
 * Register the code command (default command for running RALPH loops).
 */
export const registerCodeCommand = (program: Command): void => {
  program
    .command("run", { isDefault: true })
    .argument("<task>", "Task description or path to PRD file")
    .option("-i, --iterations <n>", "Maximum iterations", "1")
    .option("-c, --verify <commands...>", "Verification commands to run")
    .option("--branch <name>", "Git branch to create")
    .option("--push", "Push branch after completion")
    .option("--pr", "Create PR after pushing")
    .option(
      "--provider <name>",
      "LLM provider to use (claude, cursor, opencode)",
      "claude"
    )
    .option("--yolo", "Skip all permission prompts (dangerous)")
    .option("--debug", "Enable debug logging to .ferix/logs/<session>.log")
    .action(async (task: string, options) => {
      const config: LoopConfig = {
        task,
        maxIterations: Number.parseInt(options.iterations, 10),
        verifyCommands: options.verify || [],
        branch: options.branch,
        push: options.push,
        pr: options.pr,
        provider: options.provider as ProviderName,
        yolo: options.yolo,
        debug: options.debug,
      };

      try {
        await main(config);
      } catch (error) {
        console.error("Error:", error);
        process.exit(1);
      }
    });
};

// Re-export everything from action for library usage
export * from "./action.js";
export * from "./consumers/index.js";
export * from "./domain/index.js";
export * from "./layers/index.js";
export * from "./orchestrator/index.js";
export * from "./services/index.js";
