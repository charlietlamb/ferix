// GitHub repository tree fetching and filtering

import {
  checkRateLimit,
  getGitHubHeaders,
  parseRateLimitHeaders,
  type RateLimitInfo,
} from "./client";

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface FetchRepoTreeResult {
  tree: GitHubTreeItem[];
  rateLimit: RateLimitInfo;
}

/**
 * Fetch the repository tree (all files) using GitHub's Trees API
 * This is efficient as it fetches the entire tree in one request
 * Returns rate limit info for tracking purposes
 */
export async function fetchRepoTree(
  owner: string,
  repo: string
): Promise<GitHubTreeItem[]> {
  const result = await fetchRepoTreeWithRateLimit(owner, repo);
  return result.tree;
}

/**
 * Fetch the repository tree with rate limit tracking
 * Throws RateLimitError if approaching or exceeding limit
 */
export async function fetchRepoTreeWithRateLimit(
  owner: string,
  repo: string
): Promise<FetchRepoTreeResult> {
  // First, get the default branch's SHA
  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: getGitHubHeaders(),
    }
  );

  checkRateLimit(repoResponse);

  if (!repoResponse.ok) {
    throw new Error(`Failed to fetch repo info: ${repoResponse.statusText}`);
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  // Now fetch the tree recursively
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: getGitHubHeaders(),
    }
  );

  checkRateLimit(treeResponse);

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch tree: ${treeResponse.statusText}`);
  }

  const treeData: GitHubTreeResponse = await treeResponse.json();
  const rateLimit = parseRateLimitHeaders(treeResponse);

  return { tree: treeData.tree, rateLimit };
}

/**
 * Filter tree items to only include markdown files
 */
export function filterMarkdownFiles(tree: GitHubTreeItem[]): GitHubTreeItem[] {
  return tree.filter(
    (item) => item.type === "blob" && item.path.toLowerCase().endsWith(".md")
  );
}
