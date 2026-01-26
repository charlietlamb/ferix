import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { cancel, isCancel, multiselect } from "@clack/prompts";
import {
  type AgentName,
  detectAgents,
  findSkillRepos,
  installSkills,
  isValidAgentNames,
  NON_NPM_VERSION_PREFIXES,
  resolvePackageOrgs,
  SUPPORTED_AGENTS,
} from "@ferix/sync";
import { Command } from "commander";
import { Effect } from "effect";
import ora, { type Ora } from "ora";
import pc from "picocolors";
import packageJson from "../package.json" with { type: "json" };
import type { LoopConfig, ProviderName } from "./domain/index.js";
import { main } from "./program.js";

const program = new Command();

program
  .name("ferix-code")
  .description("Composable RALPH loops for AI coding agents")
  .version(packageJson.version, "-v, --version", "Output the version number");

// Default command: run task
program
  .command("run", { isDefault: true })
  .argument("<task>", "Task description or path to PRD file")
  .option("-i, --iterations <n>", "Maximum iterations", "1")
  .option("-c, --verify <commands...>", "Verification commands to run")
  .option("--branch <name>", "Git branch to create")
  .option("--push", "Push branch after completion")
  .option("--pr", "Create PR after pushing")
  .option("--provider <name>", "LLM provider to use (claude, cursor)", "claude")
  .action(async (task: string, options) => {
    const config: LoopConfig = {
      task,
      maxIterations: Number.parseInt(options.iterations, 10),
      verifyCommands: options.verify || [],
      branch: options.branch,
      push: options.push,
      pr: options.pr,
      provider: options.provider as ProviderName,
    };

    try {
      await main(config);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

// ============================================================================
// Sync Command Helpers
// ============================================================================

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

const isNonNpmDependency = (version: string): boolean =>
  NON_NPM_VERSION_PREFIXES.some((prefix) => version.startsWith(prefix));

const extractDependencies = (pkg: PackageJson): readonly string[] => {
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};
  const allDeps = new Map<string, string>();

  for (const [name, version] of Object.entries(deps)) {
    if (!isNonNpmDependency(version)) {
      allDeps.set(name, version);
    }
  }
  for (const [name, version] of Object.entries(devDeps)) {
    if (!(allDeps.has(name) || isNonNpmDependency(version))) {
      allDeps.set(name, version);
    }
  }
  return Array.from(allDeps.keys());
};

const extractWorkspacePatterns = (pkg: PackageJson): string[] => {
  const workspaces = pkg.workspaces;
  if (!workspaces) {
    return [];
  }
  if (Array.isArray(workspaces)) {
    return workspaces.filter((w): w is string => typeof w === "string");
  }
  if (typeof workspaces === "object" && "packages" in workspaces) {
    const packages = workspaces.packages;
    if (Array.isArray(packages)) {
      return packages.filter((w): w is string => typeof w === "string");
    }
  }
  return [];
};

const GLOB_SUFFIX_PATTERN = /\/\*+$/;

const expandGlobPattern = async (
  rootDir: string,
  pattern: string
): Promise<string[]> => {
  if (pattern.endsWith("/*") || pattern.endsWith("/**")) {
    const baseDir = pattern.replace(GLOB_SUFFIX_PATTERN, "");
    const fullPath = join(rootDir, baseDir);
    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(fullPath, entry.name));
    } catch {
      return [];
    }
  }
  const fullPath = join(rootDir, pattern);
  try {
    await access(fullPath);
    return [fullPath];
  } catch {
    return [];
  }
};

const readPackageJsonFile = async (filePath: string): Promise<PackageJson> => {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as PackageJson;
};

const discoverPackageJsonFiles = async (
  rootPath: string,
  rootPkg: PackageJson
): Promise<string[]> => {
  const rootDir = dirname(rootPath);
  const patterns = extractWorkspacePatterns(rootPkg);

  if (patterns.length === 0) {
    return [rootPath];
  }

  const packageJsonPaths: string[] = [rootPath];

  for (const pattern of patterns) {
    const dirs = await expandGlobPattern(rootDir, pattern);
    for (const dir of dirs) {
      const pkgPath = join(dir, "package.json");
      try {
        await access(pkgPath);
        packageJsonPaths.push(pkgPath);
      } catch {
        // No package.json in this directory
      }
    }
  }
  return packageJsonPaths;
};

// ============================================================================
// Pretty UI Components
// ============================================================================

const SYMBOLS = {
  success: pc.green("✓"),
  error: pc.red("✗"),
};

const printHeader = (title: string, subtitle?: string): void => {
  console.log();
  console.log(pc.bold(pc.cyan(`  ${title}`)));
  if (subtitle) {
    console.log(pc.dim(`  ${subtitle}`));
  }
  console.log();
};

const printSection = (title: string): void => {
  console.log();
  console.log(pc.bold(`  ${title}`));
};

const printRepo = (owner: string, repo: string, index: number): void => {
  const num = pc.dim(`${String(index + 1).padStart(2, " ")}.`);
  console.log(`  ${num} ${pc.cyan(owner)}${pc.dim("/")}${pc.white(repo)}`);
};

const printSuccess = (message: string): void => {
  console.log(`  ${SYMBOLS.success} ${pc.green(message)}`);
};

const printError = (message: string): void => {
  console.log(`  ${SYMBOLS.error} ${pc.red(message)}`);
};

const printHint = (message: string): void => {
  console.log(pc.dim(`  ${message}`));
};

const createSpinner = (text: string): Ora => {
  return ora({
    text,
    prefixText: " ",
    spinner: "dots",
  });
};

// ============================================================================
// Sync Command Types and Helpers
// ============================================================================

interface SyncOptions {
  path: string;
  dryRun: boolean;
  global: boolean;
  dev: boolean;
  agents: string[] | undefined;
  yes: boolean;
}

interface SkillRepoItem {
  owner: string;
  repo: string;
  githubUrl: string;
}

interface SyncState {
  spinner: Ora | undefined;
  packageJsonPaths: string[];
  dependencies: string[];
  orgs: string[];
  skillRepos: readonly SkillRepoItem[];
  detectedAgents: readonly AgentName[];
}

const discoverPackages = async (
  state: SyncState,
  packagePath: string
): Promise<boolean> => {
  state.spinner = createSpinner("Scanning for package.json files...").start();

  try {
    const absolutePath = resolve(packagePath);
    await access(absolutePath);
    const rootPkg = await readPackageJsonFile(absolutePath);
    state.packageJsonPaths = await discoverPackageJsonFiles(
      absolutePath,
      rootPkg
    );

    const isMonorepo = state.packageJsonPaths.length > 1;
    state.spinner.succeed(
      isMonorepo
        ? `Found ${pc.bold(String(state.packageJsonPaths.length))} package.json files ${pc.dim("(monorepo)")}`
        : "Found package.json"
    );
    return true;
  } catch (error) {
    state.spinner.fail("Failed to scan for package.json files");
    throw error;
  }
};

const extractAllDependencies = async (state: SyncState): Promise<boolean> => {
  state.spinner = createSpinner("Extracting dependencies...").start();

  try {
    const allDependencies = new Set<string>();
    for (const pkgPath of state.packageJsonPaths) {
      const pkg = await readPackageJsonFile(pkgPath);
      for (const dep of extractDependencies(pkg)) {
        allDependencies.add(dep);
      }
    }
    state.dependencies = Array.from(allDependencies);

    if (state.dependencies.length === 0) {
      state.spinner.warn("No dependencies found");
      return false;
    }

    state.spinner.succeed(
      `Found ${pc.bold(String(state.dependencies.length))} unique dependencies`
    );
    return true;
  } catch (error) {
    state.spinner.fail("Failed to extract dependencies");
    throw error;
  }
};

const resolveOrganizations = async (
  state: SyncState,
  isDev: boolean
): Promise<boolean> => {
  state.spinner = createSpinner("Resolving GitHub organizations...").start();

  try {
    const packageOrgs = await Effect.runPromise(
      resolvePackageOrgs(state.dependencies, isDev)
    );

    state.orgs = Array.from(
      new Set(
        packageOrgs
          .map((p) => p.githubOrg)
          .filter((org): org is string => org !== null)
      )
    );

    if (state.orgs.length === 0) {
      state.spinner.warn("No GitHub organizations found");
      printHint("Your dependencies don't have linked GitHub organizations.");
      return false;
    }

    state.spinner.succeed(
      `Resolved ${pc.bold(String(state.orgs.length))} GitHub organizations`
    );
    return true;
  } catch (error) {
    state.spinner.fail("Failed to resolve GitHub organizations");
    throw error;
  }
};

const findRepositories = async (
  state: SyncState,
  isDev: boolean
): Promise<boolean> => {
  state.spinner = createSpinner("Searching for skill repositories...").start();

  try {
    state.skillRepos = await Effect.runPromise(
      findSkillRepos(state.orgs, isDev)
    );

    if (state.skillRepos.length === 0) {
      state.spinner.warn("No skill repositories found");
      printHint(
        "None of your dependency organizations have published skills yet."
      );
      return false;
    }

    state.spinner.succeed(
      `Found ${pc.bold(String(state.skillRepos.length))} skill ${state.skillRepos.length === 1 ? "repository" : "repositories"}`
    );
    return true;
  } catch (error) {
    state.spinner.fail("Failed to search for skill repositories");
    throw error;
  }
};

// ============================================================================
// Repository Selection
// ============================================================================

type SelectionResult =
  | { type: "selected"; repos: readonly SkillRepoItem[] }
  | { type: "cancelled" }
  | { type: "none" };

/**
 * Prompts the user to select which repositories to install.
 * Handles edge cases: single repo, non-TTY, cancellation.
 */
const selectRepositories = async (
  skillRepos: readonly SkillRepoItem[]
): Promise<SelectionResult> => {
  // Single repository - auto-select with message
  if (skillRepos.length === 1) {
    const repo = skillRepos[0];
    if (repo) {
      printHint(
        `Only 1 repository found, auto-selecting: ${pc.cyan(`${repo.owner}/${repo.repo}`)}`
      );
    }
    return { type: "selected", repos: skillRepos };
  }

  // Non-interactive terminal - auto-select all with warning
  if (!process.stdin.isTTY) {
    printHint(
      `Non-interactive terminal detected, selecting all ${skillRepos.length} repositories.`
    );
    printHint(`Use ${pc.cyan("--yes")} flag to skip this message in CI/CD.`);
    return { type: "selected", repos: skillRepos };
  }

  // Interactive multi-select
  console.log();
  const selected = await multiselect({
    message:
      "Select repositories to install (space to toggle, a to toggle all)",
    options: skillRepos.map((repo) => ({
      value: repo,
      label: `${repo.owner}/${repo.repo}`,
    })),
    required: false,
  });

  // Handle cancellation (Ctrl+C)
  if (isCancel(selected)) {
    return { type: "cancelled" };
  }

  // Handle no selection
  if (selected.length === 0) {
    return { type: "none" };
  }

  return { type: "selected", repos: selected };
};

const installRepositories = async (
  state: SyncState,
  reposToInstall: readonly SkillRepoItem[],
  isGlobal: boolean,
  agents: readonly AgentName[]
): Promise<{ installed: string[]; failed: string[] }> => {
  printSection("Installing");
  console.log();

  const installed: string[] = [];
  const failed: string[] = [];

  for (const repo of reposToInstall) {
    const repoId = `${repo.owner}/${repo.repo}`;
    state.spinner = createSpinner(
      `Installing ${pc.cyan(repo.owner)}${pc.dim("/")}${pc.white(repo.repo)}...`
    ).start();

    try {
      await Effect.runPromise(
        installSkills([repo], {
          dryRun: false,
          global: isGlobal,
          agents: [...agents],
        })
      );
      state.spinner.succeed(
        `Installed ${pc.cyan(repo.owner)}${pc.dim("/")}${pc.white(repo.repo)}`
      );
      installed.push(repoId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      state.spinner.fail(
        `Failed to install ${pc.cyan(repo.owner)}${pc.dim("/")}${pc.white(repo.repo)}`
      );
      printHint(`  Error: ${errorMessage}`);
      failed.push(repoId);
    }
  }

  return { installed, failed };
};

const displaySummary = (
  installed: string[],
  failed: string[],
  isGlobal: boolean,
  agents: readonly string[]
): void => {
  printSection("Summary");
  console.log();

  if (installed.length > 0) {
    printSuccess(
      `${installed.length} skill ${installed.length === 1 ? "repository" : "repositories"} installed successfully`
    );
  }

  if (failed.length > 0) {
    printError(
      `${failed.length} ${failed.length === 1 ? "installation" : "installations"} failed`
    );
  }

  const installLocation = isGlobal ? "globally" : "in project";
  const agentList = agents.length > 0 ? agents.join(", ") : "all agents";
  printHint(`Skills installed ${installLocation} to: ${pc.cyan(agentList)}`);
  console.log();
};

const detectProjectAgents = async (
  state: SyncState,
  projectDir: string
): Promise<boolean> => {
  state.spinner = createSpinner("Detecting coding agents...").start();

  try {
    state.detectedAgents = await Effect.runPromise(detectAgents(projectDir));

    if (state.detectedAgents.length === 0) {
      state.spinner.warn("No coding agents detected");
      printHint(
        `No agent directories found (${pc.dim(".cursor/, .claude/, .opencode/, etc.")})`
      );
      printHint(
        `Use ${pc.cyan("--agents")} to specify agents manually, e.g. ${pc.cyan("--agents cursor claude-code")}`
      );
      return false;
    }

    state.spinner.succeed(
      `Detected agents: ${pc.cyan(state.detectedAgents.join(", "))}`
    );
    return true;
  } catch (error) {
    state.spinner.fail("Failed to detect coding agents");
    throw error;
  }
};

/**
 * Determines which agents to install skills to.
 * Returns null if validation fails or no agents found.
 */
const determineAgents = async (
  state: SyncState,
  packagePath: string,
  manualAgents: string[] | undefined
): Promise<readonly AgentName[] | null> => {
  if (manualAgents && manualAgents.length > 0) {
    if (!isValidAgentNames(manualAgents)) {
      const invalid = manualAgents.filter(
        (a) => !SUPPORTED_AGENTS.includes(a as AgentName)
      );
      printError(`Invalid agent names: ${invalid.join(", ")}`);
      printHint(`Supported agents: ${SUPPORTED_AGENTS.join(", ")}`);
      console.log();
      return null;
    }
    printSuccess(`Using specified agents: ${pc.cyan(manualAgents.join(", "))}`);
    // Type guard validates these are all valid AgentNames
    return manualAgents as AgentName[];
  }

  const projectDir = dirname(resolve(packagePath));
  const hasAgents = await detectProjectAgents(state, projectDir);
  return hasAgents ? state.detectedAgents : null;
};

/**
 * Handles repository selection based on options.
 * Returns null if user cancelled or selected none.
 */
const handleRepoSelection = async (
  skillRepos: readonly SkillRepoItem[],
  skipSelection: boolean
): Promise<readonly SkillRepoItem[] | null> => {
  if (skipSelection) {
    printSuccess(
      `Auto-selecting all ${skillRepos.length} repositories (--yes)`
    );
    return skillRepos;
  }

  const selection = await selectRepositories(skillRepos);

  if (selection.type === "cancelled") {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (selection.type === "none") {
    console.log();
    printHint("No repositories selected. Skipping installation.");
    console.log();
    return null;
  }

  printSuccess(`Selected ${selection.repos.length} repositories`);
  return selection.repos;
};

/**
 * Displays dry run summary of what would be installed.
 */
const displayDryRunSummary = (
  reposToInstall: readonly SkillRepoItem[],
  agentsToUse: readonly string[]
): void => {
  console.log();
  printSection("Would install");
  console.log();
  for (let i = 0; i < reposToInstall.length; i++) {
    const repo = reposToInstall[i];
    if (repo) {
      printRepo(repo.owner, repo.repo, i);
    }
  }
  console.log();
  printHint(
    `Would install to: ${pc.cyan(agentsToUse.join(", ") || "all agents")}`
  );
  printHint(`Run without ${pc.cyan("--dry-run")} to install these skills.`);
  console.log();
};

const runSyncCommand = async (options: SyncOptions): Promise<void> => {
  const {
    path: packagePath,
    dryRun,
    global: isGlobal,
    dev: isDev,
    agents: manualAgents,
    yes: skipSelection,
  } = options;

  printHeader(
    "Ferix Sync",
    isDev
      ? pc.yellow("Development Mode")
      : "Discovering skills from your dependencies"
  );

  const state: SyncState = {
    spinner: undefined,
    packageJsonPaths: [],
    dependencies: [],
    orgs: [],
    skillRepos: [],
    detectedAgents: [],
  };

  // Step 1: Discover package.json files
  await discoverPackages(state, packagePath);

  // Step 2: Determine which agents to install to
  const agentsToUse = await determineAgents(state, packagePath, manualAgents);
  if (!agentsToUse) {
    return;
  }

  // Step 3: Extract dependencies
  const hasDeps = await extractAllDependencies(state);
  if (!hasDeps) {
    return;
  }

  // Step 4: Resolve GitHub organizations
  const hasOrgs = await resolveOrganizations(state, isDev);
  if (!hasOrgs) {
    return;
  }

  // Step 5: Find skill repositories
  const hasRepos = await findRepositories(state, isDev);
  if (!hasRepos) {
    return;
  }

  // Step 6: Select repositories to install
  const reposToInstall = await handleRepoSelection(
    state.skillRepos,
    skipSelection
  );
  if (!reposToInstall) {
    return;
  }

  // Step 7: Handle dry run
  if (dryRun) {
    displayDryRunSummary(reposToInstall, agentsToUse);
    return;
  }

  // Step 8: Install selected skills
  const { installed, failed } = await installRepositories(
    state,
    reposToInstall,
    isGlobal,
    agentsToUse
  );

  // Summary
  displaySummary(installed, failed, isGlobal, agentsToUse);
};

// ============================================================================
// Sync Command
// ============================================================================

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
