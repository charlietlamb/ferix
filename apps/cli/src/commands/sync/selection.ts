import { confirm, isCancel, multiselect } from "@clack/prompts";
import pc from "picocolors";
import { printHint } from "../../shared/ui.js";
import type { AgentName } from "./types.js";

// ============================================================================
// Types
// ============================================================================

export interface SkillRepoItem {
  owner: string;
  repo: string;
  githubUrl: string;
}

export type SelectionResult =
  | { type: "selected"; repos: readonly SkillRepoItem[] }
  | { type: "cancelled" }
  | { type: "none" };

export type AgentSelectionResult =
  | { type: "selected"; agents: readonly AgentName[] }
  | { type: "cancelled" }
  | { type: "none" };

export type ConfirmationResult = { type: "confirmed" } | { type: "cancelled" };

// ============================================================================
// Repository Selection
// ============================================================================

/**
 * Prompts the user to select which repositories to install.
 * Handles edge cases: single repo, non-TTY, cancellation.
 */
export const selectRepositories = async (
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

// ============================================================================
// Agent Selection
// ============================================================================

/**
 * Prompts the user to select which coding agents to install skills to.
 * Handles edge cases: non-TTY, cancellation.
 * Pre-selects detected agents by default.
 */
export const selectAgents = async (
  detectedAgents: readonly AgentName[],
  allAgents: readonly AgentName[]
): Promise<AgentSelectionResult> => {
  // Non-interactive terminal - auto-select detected with warning
  if (!process.stdin.isTTY) {
    if (detectedAgents.length === 0) {
      printHint("Non-interactive terminal detected, no agents auto-selected.");
      return { type: "none" };
    }
    printHint(
      `Non-interactive terminal detected, selecting ${detectedAgents.length} detected agents.`
    );
    printHint(`Use ${pc.cyan("--yes")} flag to skip this message in CI/CD.`);
    return { type: "selected", agents: detectedAgents };
  }

  // Interactive multi-select (always show, even for single agent)
  console.log();
  const selected = await multiselect({
    message:
      "Select coding agents to install skills to (space to toggle, a to toggle all)",
    options: allAgents.map((agent) => ({
      value: agent,
      label: agent,
    })),
    initialValues: [...detectedAgents],
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

  return { type: "selected", agents: selected as AgentName[] };
};

// ============================================================================
// Installation Confirmation
// ============================================================================

/**
 * Displays a summary of the installation and prompts for confirmation.
 */
export const confirmInstallation = async (
  repos: readonly SkillRepoItem[],
  agents: readonly AgentName[],
  isGlobal: boolean
): Promise<ConfirmationResult> => {
  // Non-interactive terminal - auto-confirm
  if (!process.stdin.isTTY) {
    return { type: "confirmed" };
  }

  // Display summary box
  console.log();
  console.log(pc.bold("  Installation Summary"));
  console.log(pc.dim("  ─────────────────────────────────────────"));
  console.log();

  // Repositories section
  console.log(
    `  ${pc.bold(pc.cyan("Repositories"))} ${pc.dim(`(${repos.length})`)}`
  );
  for (const repo of repos) {
    console.log(
      `    ${pc.dim("•")} ${pc.cyan(repo.owner)}${pc.dim("/")}${pc.white(repo.repo)}`
    );
  }
  console.log();

  // Agents section
  console.log(
    `  ${pc.bold(pc.cyan("Agents"))} ${pc.dim(`(${agents.length})`)}`
  );
  for (const agent of agents) {
    console.log(`    ${pc.dim("•")} ${pc.white(agent)}`);
  }
  console.log();

  // Location
  const location = isGlobal ? "globally" : "in project";
  console.log(`  ${pc.bold(pc.cyan("Location"))} ${pc.white(location)}`);
  console.log();
  console.log(pc.dim("  ─────────────────────────────────────────"));

  // Confirmation prompt
  const confirmed = await confirm({
    message: "Proceed with installation?",
    initialValue: true,
  });

  if (isCancel(confirmed) || !confirmed) {
    return { type: "cancelled" };
  }

  return { type: "confirmed" };
};
