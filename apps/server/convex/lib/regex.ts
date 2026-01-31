/**
 * Shared regex patterns for URL parsing and validation.
 * Centralized to ensure consistency across the codebase.
 */

/**
 * Validates a full GitHub URL and extracts owner/repo.
 * Allows dots in repo names (e.g., next.js) but requires https://github.com/ prefix.
 *
 * Matches:
 * - https://github.com/vercel/next.js
 * - https://github.com/org/repo
 * - https://github.com/org/repo/
 *
 * Capture groups: [1] = owner, [2] = repo
 */
export const GITHUB_URL_REGEX =
  /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/?$/;

/**
 * Extracts owner/repo from various GitHub URL formats (npm, ssh, git, etc.).
 * More permissive than GITHUB_URL_REGEX - handles git://, ssh://, .git suffix, etc.
 *
 * Matches:
 * - github.com/org/repo
 * - git+https://github.com/org/repo.git
 * - git://github.com/org/repo.git
 * - https://github.com/org/repo.git
 * - ssh://git@github.com/org/repo.git
 * - github.com:org/repo (SSH shorthand)
 *
 * Capture groups: [1] = owner, [2] = repo (without .git suffix)
 */
export const GITHUB_REPO_PATTERN =
  /github\.com[:/]([\w-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/;

/**
 * Extracts org/repo from skills.sh URLs.
 * Uses non-greedy matching + positive lookahead for boundaries + negative lookbehind
 * to allow dots in repo names (e.g., next.js) but reject file extensions (.svg, .png, etc.).
 *
 * Matches:
 * - https://skills.sh/vercel/next.js
 * - https://skills.sh/org/repo
 * - https://skills.sh/org/repo/
 *
 * Rejects:
 * - https://skills.sh/org/repo.svg
 * - https://skills.sh/org/repo.png
 *
 * Capture groups: [1] = owner, [2] = repo
 */
export const SKILLS_SH_URL_REGEX =
  /https:\/\/skills\.sh\/([\w-]+)\/([\w.-]+?)(?=\/|$|\s|\)|\]|")(?<!\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|json|xml|html|pdf))/g;

/**
 * Common file extension patterns
 */
export const MD_EXTENSION_REGEX = /\.md$/i;
export const TRAILING_SLASH_REGEX = /\/$/;

/**
 * Parse a GitHub URL to extract owner and repo.
 * Returns null if the URL doesn't match the expected format.
 */
export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_URL_REGEX);
  if (!(match?.[1] && match?.[2])) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Extract owner/repo from various GitHub URL formats.
 * More permissive than parseGithubUrl - handles git://, ssh://, .git suffix, etc.
 * Returns null if no GitHub URL pattern is found.
 */
export function extractGithubRepo(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(GITHUB_REPO_PATTERN);
  if (!(match?.[1] && match?.[2])) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}
