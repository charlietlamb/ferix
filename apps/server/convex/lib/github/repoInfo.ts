// GitHub repository metadata fetching

import { getGitHubHeaders } from "./client";

export interface GitHubRepoInfo {
  fullName: string;
  description: string | null;
  avatarUrl: string;
  stars: number;
  htmlUrl: string;
}

/**
 * Fetch GitHub repository info with authentication
 */
export async function fetchRepoInfo(
  owner: string,
  repo: string
): Promise<GitHubRepoInfo> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: getGitHubHeaders() }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Repository not found or is private");
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    fullName: data.full_name,
    description: data.description,
    avatarUrl: data.owner.avatar_url,
    stars: data.stargazers_count,
    htmlUrl: data.html_url,
  };
}
