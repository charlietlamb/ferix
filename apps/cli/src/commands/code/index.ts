import type { Command } from "commander";
import { launchSelector } from "./launcher.js";

/**
 * Register the code command (default command for running RALPH loops).
 */
export const registerCodeCommand = (program: Command): void => {
  program
    .command("run", { isDefault: true })
    .argument(
      "[task]",
      "Task description or path to PRD file (omit to see sessions)"
    )
    .option("-i, --iterations <n>", "Maximum iterations")
    .option("-c, --verify <commands...>", "Verification commands to run")
    .option("--branch <name>", "Git branch to create")
    .option("--push", "Push branch after completion")
    .option("--pr", "Create PR after pushing")
    .option(
      "--provider <name>",
      "LLM provider to use (claude, cursor, opencode)"
    )
    .option(
      "--no-yolo",
      "Require permission prompts (default runs in yolo mode on isolated worktree)"
    )
    .option("-d, --debug", "Enable debug logging to .ferix/logs/<session>.log")
    .action(async (task: string | undefined, options) => {
      try {
        const trimmedTask = task?.trim() || undefined;
        await launchSelector(options, trimmedTask);
      } catch (error) {
        console.error("Error:", error);
        process.exit(1);
      }
    });
};

// Re-export everything from action for library usage
export * from "./action.js";
export * from "./consumers/index.js";
export * from "./daemon/index.js";
export * from "./domain/index.js";
export * from "./layers/index.js";
export * from "./orchestrator/index.js";
export * from "./services/index.js";
