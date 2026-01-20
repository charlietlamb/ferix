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
 * Check if there are uncommitted changes
 */
export async function hasUncommittedChanges(): Promise<boolean> {
  const result = await shell("git", ["status", "--porcelain"]);
  return result.stdout.trim().length > 0;
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
 * Switch to an existing branch
 */
export async function switchBranch(name: string): Promise<void> {
  const result = await shell("git", ["checkout", name]);
  if (!result.success) {
    throw new Error(`Failed to switch to branch '${name}': ${result.stderr}`);
  }
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
 */
export async function createPullRequest(baseBranch: string): Promise<void> {
  logger.step(`Creating pull request against ${baseBranch}`);

  // Check if gh CLI is available
  const ghCheck = await shell("gh", ["--version"]);
  if (!ghCheck.success) {
    logger.warn("GitHub CLI (gh) not found. Skipping PR creation.");
    logger.dim("Install with: brew install gh");
    return;
  }

  // Create PR with --fill to use commit info
  const result = await shellInteractive("gh", [
    "pr",
    "create",
    "--base",
    baseBranch,
    "--fill",
  ]);

  if (result.success) {
    logger.success("Pull request created!");
  } else {
    logger.warn("Failed to create pull request. You can create it manually.");
  }
}

/**
 * Check if we're in a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  const result = await shell("git", ["rev-parse", "--git-dir"]);
  return result.success;
}
