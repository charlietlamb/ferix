// GitHub API utilities for fetching repository contents

const REGEX_UTILS = {
  GITHUB_URL: /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/,
  TRAILING_SLASH: /\/$/,
  MD_EXTENSION: /\.md$/i,
};

const GENERIC_FILENAMES = [
  "skill",
  "skills",
  "agent",
  "agents",
  "readme",
  "index",
];

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

export interface MarkdownFile {
  path: string;
  title: string;
  content: string;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(REGEX_UTILS.GITHUB_URL);
  if (!(match?.[1] && match?.[2])) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Fetch the repository tree (all files) using GitHub's Trees API
 * This is efficient as it fetches the entire tree in one request
 */
export async function fetchRepoTree(
  owner: string,
  repo: string
): Promise<GitHubTreeItem[]> {
  // First, get the default branch's SHA
  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Ferix-Skills-Directory",
      },
    }
  );

  if (!repoResponse.ok) {
    throw new Error(`Failed to fetch repo info: ${repoResponse.statusText}`);
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  // Now fetch the tree recursively
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Ferix-Skills-Directory",
      },
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to fetch tree: ${treeResponse.statusText}`);
  }

  const treeData: GitHubTreeResponse = await treeResponse.json();
  return treeData.tree;
}

/**
 * Filter tree items to only include markdown files
 */
export function filterMarkdownFiles(tree: GitHubTreeItem[]): GitHubTreeItem[] {
  return tree.filter(
    (item) => item.type === "blob" && item.path.toLowerCase().endsWith(".md")
  );
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Extract title from file path
 * Format: "{Owner Name} - {File/Directory Name}"
 *
 * Examples:
 *   - "create-auth/SKILL.md" with owner "better-auth" -> "Better Auth - Create Auth"
 *   - "explain-error.md" with owner "better-auth" -> "Better Auth - Explain Error"
 *   - "SKILL.md" (at root) with owner "better-auth" -> "Better Auth"
 */
export function extractTitle(filePath: string, ownerName: string): string {
  const ownerTitle = formatTitle(ownerName);
  const parts = filePath.split("/");
  const filename = parts.at(-1) ?? "";
  // Remove .md extension (case insensitive)
  const filenameWithoutExt = filename.replace(REGEX_UTILS.MD_EXTENSION, "");

  // Check if filename is generic
  if (GENERIC_FILENAMES.includes(filenameWithoutExt.toLowerCase())) {
    // Use parent directory name if available
    if (parts.length > 1) {
      const dirName = parts.at(-2);
      const dirTitle = formatTitle(dirName ?? "");
      // If dir title is same as owner title, just return owner title
      if (dirTitle.toLowerCase() === ownerTitle.toLowerCase()) {
        return ownerTitle;
      }
      return `${ownerTitle} - ${dirTitle}`;
    }
    // At root with generic name, just return owner name
    return ownerTitle;
  }

  // Non-generic filename
  const fileTitle = formatTitle(filenameWithoutExt);
  // If file title is same as owner title, just return owner title
  if (fileTitle.toLowerCase() === ownerTitle.toLowerCase()) {
    return ownerTitle;
  }
  return `${ownerTitle} - ${fileTitle}`;
}

/**
 * Format a slug/filename into a readable title
 * "my-cool-skill" -> "My Cool Skill"
 */
export function formatTitle(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
