import { isCancel, multiselect } from "@clack/prompts";
import pc from "picocolors";
import { printHint } from "../../shared/ui.js";

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
