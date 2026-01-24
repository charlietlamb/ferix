import { MESSAGES } from "../constants.js";
import { logger } from "../utils/logger.js";
import { shell, shellInteractive } from "../utils/shell.js";

/**
 * Get the current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  const result = await shell("git", ["branch", "--show-current"]);
  if (!result.success) {
    throw new Error(
      "Failed to get current branch. Are you in a git repository?"
    );
  }
  return result.stdout.trim();
}

/**
 * Create and switch to a new branch
 */
export async function createBranch(name: string): Promise<void> {
  logger.step(`Creating branch: ${name}`);
  const result = await shell("git", ["checkout", "-b", name]);
  if (!result.success) {
    throw new Error(`Failed to create branch '${name}': ${result.stderr}`);
  }
  logger.success(`Switched to new branch: ${name}`);
}

/**
 * Push branch to origin with upstream tracking
 */
export async function pushBranch(branch: string): Promise<void> {
  logger.step(`Pushing branch: ${branch}`);
  const result = await shell("git", ["push", "-u", "origin", branch]);
  if (!result.success) {
    throw new Error(`Failed to push branch: ${result.stderr}`);
  }
  logger.success(`Pushed to origin/${branch}`);
}

/**
 * Create a pull request using GitHub CLI
 * Returns the PR URL if successful, null otherwise
 */
export async function createPullRequest(
  baseBranch: string
): Promise<string | null> {
  logger.step(`Creating pull request against ${baseBranch}`);

  // Check if gh CLI is available
  const ghCheck = await shell("gh", ["--version"]);
  if (!ghCheck.success) {
    logger.warn("GitHub CLI (gh) not found. Skipping PR creation.");
    logger.dim(MESSAGES.GH_INSTALL_HINT);
    return null;
  }

  // Create PR with --fill to use commit info
  const result = await shellInteractive("gh", [
    "pr",
    "create",
    "--base",
    baseBranch,
    "--fill",
  ]);

  if (!result.success) {
    logger.warn("Failed to create pull request. You can create it manually.");
    return null;
  }

  // Try to get the PR URL from gh pr view
  const prView = await shell("gh", [
    "pr",
    "view",
    "--json",
    "url",
    "-q",
    ".url",
  ]);
  if (prView.success && prView.stdout.trim()) {
    const prUrl = prView.stdout.trim();
    logger.success(`Pull request created: ${prUrl}`);
    return prUrl;
  }

  logger.success("Pull request created!");
  return null;
}

/**
 * Check if we're in a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  const result = await shell("git", ["rev-parse", "--git-dir"]);
  return result.success;
}
