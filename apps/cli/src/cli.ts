import { Command } from "commander";
import type { ExplicitCliFlags } from "./config/schema.js";
import { CLI, DEFAULTS, UI } from "./constants.js";
import { isGitRepo } from "./git/index.js";
import { truncate } from "./tui/ansi.js";
import type { Question } from "./tui/retro-form.js";
import { RetroForm } from "./tui/retro-form.js";
import type { FerixConfig } from "./types.js";

/**
 * Result of parsing CLI options, including explicit flag tracking
 */
export interface ParsedCliOptions {
  /** The parsed config (null if no task provided) */
  config: FerixConfig | null;
  /** Which config-file-overridable flags were explicitly set */
  explicit: ExplicitCliFlags;
}

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
 * Defaults for interactive questions when config is not loaded
 */
interface QuestionDefaults {
  verify?: string;
  iterations?: number;
  progress?: boolean;
}

/**
 * Build the questions array based on whether we're in a git repo
 * @param inGitRepo Whether the current directory is a git repository
 * @param defaults Optional defaults from ferix.json config file
 */
function buildQuestions(
  inGitRepo: boolean,
  defaults: QuestionDefaults = {}
): Question[] {
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
      initial: defaults.verify,
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
      initial: defaults.iterations,
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

  // Progress tracking - default to config value or true
  questions.push({
    type: "confirm",
    id: "progress",
    label: "Track progress in .ferix/PROGRESS.md?",
    initial: defaults.progress ?? true,
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

  // Load config file for defaults
  let configDefaults: QuestionDefaults = {};
  let configProgressPath: string | undefined;
  try {
    const { loadConfig } = await import("./config/loader.js");
    const { config } = await loadConfig();

    // Convert config to question defaults
    configDefaults = {
      // Convert verify array to comma-separated string for text input
      verify: config.verify?.join(", "),
      // Pass iterations directly
      iterations: config.iterations,
      // Convert progress string/false to boolean for confirm question
      progress: config.progress !== false,
    };
    // Preserve custom progress path for later use
    if (typeof config.progress === "string") {
      configProgressPath = config.progress;
    }
  } catch (error) {
    // Show warning for config errors but continue - user can override values
    const { ConfigParseError, ConfigValidationError } = await import(
      "./config/errors.js"
    );
    if (error instanceof ConfigParseError) {
      console.error(`\x1b[33m[WARN]\x1b[0m ${error.message}`);
      console.error(
        "\x1b[2mUsing default values. Fix ferix.json to use config defaults.\x1b[0m\n"
      );
    } else if (error instanceof ConfigValidationError) {
      console.error(`\x1b[33m[WARN]\x1b[0m ${error.message}`);
      console.error(
        "\x1b[2mUsing default values. Fix ferix.json to use config defaults.\x1b[0m\n"
      );
    }
    // Silently ignore other errors (e.g., permission issues)
  }

  // Get main answers
  const questions = buildQuestions(inGitRepo, configDefaults);
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

  // Use custom progress path from config if available, otherwise use default
  const progressPath = answers.progress
    ? (configProgressPath ?? DEFAULTS.PROGRESS_FILE)
    : false;

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
    progress: progressPath,
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
    Progress: config.progress ? String(config.progress) : "disabled",
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
 * Detect which options were explicitly set via CLI (not defaults)
 */
function getExplicitFlags(program: Command): ExplicitCliFlags {
  const verifySource = program.getOptionValueSource("verify");
  const iterationsSource = program.getOptionValueSource("iterations");
  const progressSource = program.getOptionValueSource("progress");

  return {
    // Explicitly set if source is 'cli' (from command line)
    // --no-verify sets verify to false, which is also explicit
    verify: verifySource === "cli",
    iterations: iterationsSource === "cli",
    progress: progressSource === "cli",
  };
}

/**
 * Parse CLI options into FerixConfig with explicit flag tracking
 */
export function parseOptions(
  program: Command,
  options: Record<string, unknown>
): ParsedCliOptions {
  const explicit = getExplicitFlags(program);

  if (!options.task) {
    return { config: null, explicit };
  }

  const pr = Boolean(options.pr);
  const push = Boolean(options.push) || pr;

  const config: FerixConfig = {
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

  return { config, explicit };
}
