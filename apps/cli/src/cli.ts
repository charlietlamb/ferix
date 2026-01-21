import { Command } from "commander";
import { CLI, DEFAULTS, UI } from "./constants.js";
import { isGitRepo } from "./git/index.js";
import { truncate } from "./tui/ansi.js";
import type { Question } from "./tui/retro-form.js";
import { RetroForm } from "./tui/retro-form.js";
import type { FerixConfig } from "./types.js";

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
 * Build the questions array based on whether we're in a git repo
 */
function buildQuestions(inGitRepo: boolean): Question[] {
  const questions: Question[] = [
    {
      type: "text",
      id: "task",
      label: "What should the AI work on?",
      placeholder: "e.g., Get ticket ENG-345 from Linear and implement it",
      required: true,
    },
    {
      type: "text",
      id: "verify",
      label: "Verification commands",
      placeholder: "comma-separated, e.g., bun lint, bun test (or leave empty)",
    },
    {
      type: "select",
      id: "iterations",
      label: "How many iterations?",
      options: [
        { value: 1, label: "1", hint: "single run" },
        { value: 3, label: "3" },
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: -1, label: "Until complete", hint: "loops until done" },
      ],
    },
  ];

  // Git options only if in a repo
  if (inGitRepo) {
    questions.push({
      type: "select",
      id: "gitStrategy",
      label: "Git branch strategy",
      options: [
        {
          value: "current",
          label: "Current branch",
          hint: "stay where you are",
        },
        { value: "new", label: "New branch", hint: "create a feature branch" },
      ],
    });
  }

  // Progress tracking
  questions.push({
    type: "confirm",
    id: "progress",
    label: "Track progress in .ferix/PROGRESS.md?",
    initial: true,
  });

  // Final confirmation
  questions.push({
    type: "confirm",
    id: "confirm",
    label: "Start the Ferix loop?",
    initial: true,
  });

  return questions;
}

/**
 * Build additional questions for git branch flow
 */
function buildBranchQuestions(): Question[] {
  return [
    {
      type: "text",
      id: "branchName",
      label: "Branch name",
      placeholder: "e.g., feat/eng-345 or fix/login-bug",
      required: true,
      validate: (value) => {
        if (!BRANCH_NAME_PATTERN.test(value)) {
          return "Invalid branch name (use letters, numbers, -, _, /)";
        }
        return undefined;
      },
    },
    {
      type: "select",
      id: "afterCompletion",
      label: "After completion",
      options: [
        { value: "nothing", label: "Keep local", hint: "don't push" },
        { value: "push", label: "Push", hint: "push to origin" },
        {
          value: "pr",
          label: "Push + PR",
          hint: "push and create pull request",
        },
      ],
    },
  ];
}

/**
 * Run interactive prompts to build configuration using retro TUI
 */
export async function runInteractive(): Promise<FerixConfig | null> {
  const inGitRepo = await isGitRepo();
  const form = new RetroForm();

  // Get main answers
  const questions = buildQuestions(inGitRepo);
  const answers = await form.run(questions);

  if (!answers) {
    form.showCancelled();
    return null;
  }

  // Check if user confirmed
  if (answers.confirm === false) {
    form.showCancelled();
    return null;
  }

  // Handle git branch flow
  let branch: string | undefined;
  let push = false;
  let pr = false;

  if (answers.gitStrategy === "new") {
    const branchQuestions = buildBranchQuestions();
    const branchAnswers = await form.run(branchQuestions);

    if (!branchAnswers) {
      form.showCancelled();
      return null;
    }

    branch = branchAnswers.branchName as string;
    const after = branchAnswers.afterCompletion as string;
    push = after === "push" || after === "pr";
    pr = after === "pr";
  }

  // Parse iterations
  const iterationsValue = answers.iterations as number;
  const untilComplete = iterationsValue === -1;
  const iterations = untilComplete ? DEFAULTS.ITERATIONS : iterationsValue;

  const config: FerixConfig = {
    task: answers.task as string,
    verify: parseCommaSeparated((answers.verify as string) || ""),
    iterations,
    untilComplete,
    branch,
    baseBranch: undefined,
    push,
    pr,
    commit: true,
    progress: answers.progress ? DEFAULTS.PROGRESS_FILE : false,
    dryRun: false,
    verbose: false,
  };

  // Show summary before starting
  form.showSummary({
    Task: truncate(config.task, UI.TASK_DISPLAY_MAX_LENGTH),
    Verify: config.verify.length > 0 ? config.verify.join(", ") : "none",
    Iterations: config.untilComplete
      ? "until complete"
      : String(config.iterations),
    Branch: config.branch ?? "current",
    After: getAfterText(config.pr, config.push),
    Progress: config.progress ? ".ferix/PROGRESS.md" : "disabled",
  });

  form.showStarting();

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
    .option("--verbose", "Detailed output")
    .option("-c, --continue", "Continue from existing .ferix/PLAN.md");

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
    resume: Boolean(options.continue),
  };
}
