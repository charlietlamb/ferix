import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { cancel } from "@clack/prompts";
import { Effect } from "effect";
import type { Ora } from "ora";
import pc from "picocolors";
import {
  createSpinner,
  printError,
  printHeader,
  printHint,
  printRepo,
  printSection,
  printSuccess,
} from "../../shared/ui.js";
import {
  detectAgents,
  isValidAgentNames,
  SUPPORTED_AGENTS,
} from "./detect-agents.js";
import { findSkillRepos } from "./find-skills.js";
import {
  discoverPackageJsonFiles,
  extractDependencies,
  readPackageJsonFile,
} from "./helpers.js";
import { installSkills } from "./install-skills.js";
import { resolvePackageOrgs } from "./resolve-orgs.js";
import {
  confirmInstallation,
  type SkillRepoItem,
  selectAgents,
  selectRepositories,
} from "./selection.js";
import type { AgentName } from "./types.js";

// ============================================================================
// Types
// ============================================================================

interface SyncOptions {
  path: string;
  dryRun: boolean;
  global: boolean;
  dev: boolean;
  agents: string[] | undefined;
  yes: boolean;
}

interface SyncState {
  spinner: Ora | undefined;
  packageJsonPaths: string[];
  dependencies: string[];
  orgs: string[];
  skillRepos: readonly SkillRepoItem[];
  detectedAgents: readonly AgentName[];
}

// ============================================================================
// Discovery Phase
// ============================================================================

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

// ============================================================================
// Resolution Phase
// ============================================================================

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
// Agent Detection
// ============================================================================

const detectProjectAgents = async (
  state: SyncState,
  projectDir: string
): Promise<void> => {
  state.spinner = createSpinner("Detecting coding agents...").start();

  try {
    state.detectedAgents = await Effect.runPromise(detectAgents(projectDir));

    if (state.detectedAgents.length === 0) {
      state.spinner.info("No coding agents detected");
    } else {
      state.spinner.succeed(
        `Detected agents: ${pc.cyan(state.detectedAgents.join(", "))}`
      );
    }
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
  manualAgents: string[] | undefined,
  skipSelection: boolean
): Promise<readonly AgentName[] | null> => {
  // Manual agents via --agents flag - use directly
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
    return manualAgents as AgentName[];
  }

  // Detect agents in project
  const projectDir = dirname(resolve(packagePath));
  await detectProjectAgents(state, projectDir);

  // --yes flag: auto-select detected agents
  if (skipSelection) {
    if (state.detectedAgents.length === 0) {
      printHint("No agents detected. Use --agents to specify agents manually.");
      return null;
    }
    printSuccess(
      `Auto-selecting detected agents: ${pc.cyan(state.detectedAgents.join(", "))}`
    );
    return state.detectedAgents;
  }

  // Interactive selection
  const selection = await selectAgents(state.detectedAgents, SUPPORTED_AGENTS);

  if (selection.type === "cancelled") {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  if (selection.type === "none") {
    console.log();
    printHint("No agents selected. Skills won't be installed to any agent.");
    console.log();
    return null;
  }

  printSuccess(
    `Selected ${selection.agents.length} agents: ${pc.cyan(selection.agents.join(", "))}`
  );
  return selection.agents;
};

// ============================================================================
// Selection & Installation
// ============================================================================

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

// ============================================================================
// Summary Display
// ============================================================================

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

// ============================================================================
// Main Action
// ============================================================================

export const runSyncCommand = async (options: SyncOptions): Promise<void> => {
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
  const agentsToUse = await determineAgents(
    state,
    packagePath,
    manualAgents,
    skipSelection
  );
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

  // Step 8: Confirm installation (skip if --yes flag is used)
  if (!skipSelection) {
    const confirmation = await confirmInstallation(
      reposToInstall,
      agentsToUse,
      isGlobal
    );
    if (confirmation.type === "cancelled") {
      cancel("Installation cancelled.");
      process.exit(0);
    }
  }

  // Step 9: Install selected skills
  const { installed, failed } = await installRepositories(
    state,
    reposToInstall,
    isGlobal,
    agentsToUse
  );

  // Summary
  displaySummary(installed, failed, isGlobal, agentsToUse);
};
