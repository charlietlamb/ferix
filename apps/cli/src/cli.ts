import { cancel, confirm, isCancel, select, text } from "@clack/prompts";
import { Command } from "commander";
import { CLI, DEFAULTS } from "./constants.js";
import { isGitRepo } from "./git/index.js";
import type { FerixConfig } from "./types.js";
import { logger } from "./utils/logger.js";

/** Regex pattern for valid branch names */
const BRANCH_NAME_PATTERN = /^[\w\-/]+$/;

/**
 * Parse comma-separated string into array
 */
function parseCommaSeparated(value: string): string[] {
  if (!value || value.toLowerCase() === "none") {
    return [];
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Truncate string with ellipsis
 */
function truncate(str: string, max: number): string {
  if (str.length <= max) {
    return str;
  }
  return `${str.slice(0, max - 3)}...`;
}

/**
 * Get after completion display text
 */
function getAfterText(pr: boolean, push: boolean): string {
  if (pr) {
    return "push + PR";
  }
  if (push) {
    return "push";
  }
  return "nothing";
}

/**
 * Collect iteration count from user
 */
async function collectIterations(): Promise<{
  iterations: number;
  untilComplete: boolean;
}> {
  const selection = await select({
    message: "How many iterations?",
    options: [
      { value: 1, label: "1 (single run)" },
      { value: 5, label: "5" },
      { value: 10, label: "10" },
      { value: -1, label: "Until complete" },
      { value: 0, label: "Custom" },
    ],
  });

  if (isCancel(selection)) {
    cancel("Cancelled");
    process.exit(0);
  }

  if (selection === -1) {
    return { iterations: DEFAULTS.ITERATIONS, untilComplete: true };
  }

  if (selection === 0) {
    const custom = await text({
      message: "Enter number of iterations:",
      validate: (value) => {
        const num = Number.parseInt(value, 10);
        if (Number.isNaN(num) || num < 1) {
          return "Enter a positive number";
        }
      },
    });

    if (isCancel(custom)) {
      cancel("Cancelled");
      process.exit(0);
    }

    return {
      iterations: Number.parseInt(custom as string, 10),
      untilComplete: false,
    };
  }

  return { iterations: selection as number, untilComplete: false };
}

/**
 * Collect git branch configuration from user
 */
async function collectGitConfig(
  inGitRepo: boolean
): Promise<{ branch?: string; push: boolean; pr: boolean }> {
  if (!inGitRepo) {
    return { branch: undefined, push: false, pr: false };
  }

  const branchStrategy = await select({
    message: "Git branch strategy?",
    options: [
      { value: "current", label: "Stay on current branch" },
      { value: "new", label: "Create new branch" },
    ],
  });

  if (isCancel(branchStrategy)) {
    cancel("Cancelled");
    process.exit(0);
  }

  if (branchStrategy === "current") {
    return { branch: undefined, push: false, pr: false };
  }

  const branchName = await text({
    message: "Branch name:",
    placeholder: "e.g., feat/eng-345",
    validate: (value) => {
      if (!value.trim()) {
        return "Branch name is required";
      }
      if (!BRANCH_NAME_PATTERN.test(value)) {
        return "Invalid branch name";
      }
    },
  });

  if (isCancel(branchName)) {
    cancel("Cancelled");
    process.exit(0);
  }

  const afterCompletion = await select({
    message: "After completion?",
    options: [
      { value: "nothing", label: "Nothing (keep local)" },
      { value: "push", label: "Push to origin" },
      { value: "pr", label: "Push and create PR" },
    ],
  });

  if (isCancel(afterCompletion)) {
    cancel("Cancelled");
    process.exit(0);
  }

  return {
    branch: branchName as string,
    push: afterCompletion === "push" || afterCompletion === "pr",
    pr: afterCompletion === "pr",
  };
}

/**
 * Run interactive prompts to build configuration
 */
export async function runInteractive(): Promise<FerixConfig | null> {
  logger.header();

  const inGitRepo = await isGitRepo();

  // Task
  const task = await text({
    message: "What should the AI work on?",
    placeholder: "e.g., Get ticket ENG-345 from Linear and implement it",
    validate: (value) => {
      if (!value.trim()) {
        return "Task is required";
      }
    },
  });

  if (isCancel(task)) {
    cancel("Cancelled");
    return null;
  }

  // Verification
  const verify = await text({
    message: "What commands verify the work? (comma-separated, or 'none')",
    placeholder: "e.g., bun lint, bun test",
    initialValue: "",
  });

  if (isCancel(verify)) {
    cancel("Cancelled");
    return null;
  }

  // Iterations
  const { iterations, untilComplete } = await collectIterations();

  // Git config
  const gitConfig = await collectGitConfig(inGitRepo);

  // Progress
  const progress = await confirm({
    message: "Track progress in progress.txt?",
    initialValue: true,
  });

  if (isCancel(progress)) {
    cancel("Cancelled");
    return null;
  }

  const config: FerixConfig = {
    task: task as string,
    verify: parseCommaSeparated(verify as string),
    iterations,
    untilComplete,
    branch: gitConfig.branch,
    baseBranch: undefined,
    push: gitConfig.push,
    pr: gitConfig.pr,
    commit: true,
    progress: progress ? DEFAULTS.PROGRESS_FILE : false,
    dryRun: false,
    verbose: false,
  };

  // Show summary
  logger.summary({
    Task: truncate(config.task, 40),
    Verify: config.verify.length > 0 ? config.verify.join(", ") : "none",
    Iterations: config.untilComplete
      ? "until complete"
      : String(config.iterations),
    Branch: config.branch ?? "current",
    After: getAfterText(config.pr, config.push),
    Progress: config.progress ? "progress.txt" : "disabled",
  });

  // Confirm
  const confirmed = await confirm({
    message: "Start the loop?",
  });

  if (isCancel(confirmed) || !confirmed) {
    cancel("Cancelled");
    return null;
  }

  return config;
}

/**
 * Create and configure the CLI program
 */
export function createProgram(): Command {
  const program = new Command()
    .name(CLI.NAME)
    .version(CLI.VERSION)
    .description(CLI.DESCRIPTION);

  program
    .option("-t, --task <text>", "What the AI should work on")
    .option(
      "-v, --verify <cmd>",
      "Verification command (repeatable)",
      (val, prev: string[]) => [...prev, val],
      []
    )
    .option("--no-verify", "Skip verification")
    .option(
      "-n, --iterations <n>",
      "Number of iterations",
      String(DEFAULTS.ITERATIONS)
    )
    .option("--until-complete", "Loop until <ferix:complete> signal")
    .option("-b, --branch <name>", "Create and switch to branch")
    .option("--push", "Push branch after completion")
    .option("--pr", "Create PR after pushing (implies --push)")
    .option("--no-commit", "Don't auto-commit")
    .option("--progress <path>", "Progress file path", DEFAULTS.PROGRESS_FILE)
    .option("--no-progress", "Don't track progress")
    .option("--dry-run", "Show prompt without executing")
    .option("--verbose", "Detailed output");

  return program;
}

/**
 * Parse CLI options into FerixConfig
 */
export function parseOptions(
  options: Record<string, unknown>
): FerixConfig | null {
  if (!options.task) {
    return null;
  }

  const pr = Boolean(options.pr);
  const push = Boolean(options.push) || pr;

  return {
    task: options.task as string,
    verify: options.verify === false ? [] : (options.verify as string[]),
    iterations: Number.parseInt(options.iterations as string, 10),
    untilComplete: Boolean(options.untilComplete),
    branch: options.branch as string | undefined,
    baseBranch: undefined,
    push,
    pr,
    commit: options.commit !== false,
    progress: options.progress === false ? false : (options.progress as string),
    dryRun: Boolean(options.dryRun),
    verbose: Boolean(options.verbose),
  };
}
