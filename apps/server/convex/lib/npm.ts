/**
 * Helper functions for interacting with the npm registry.
 */

import { GITHUB_REPO_PATTERN } from "./regex";

interface NpmPackageInfo {
  name: string;
  repository?: {
    type?: string;
    url?: string;
  };
}

interface PackageOrgResult {
  packageName: string;
  githubOrg: string | null;
  repositoryUrl: string | null;
}

/**
 * Fetches package information from the npm registry.
 */
export async function fetchNpmPackage(
  name: string
): Promise<NpmPackageInfo | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as NpmPackageInfo;
  } catch {
    return null;
  }
}

/**
 * Extracts the GitHub organization from various repository URL formats.
 *
 * Supported formats:
 * - github.com/org/repo
 * - git+https://github.com/org/repo.git
 * - git://github.com/org/repo.git
 * - https://github.com/org/repo.git
 * - ssh://git@github.com/org/repo.git
 */
export function extractGitHubOrg(repositoryUrl: string | undefined): {
  org: string | null;
  url: string | null;
} {
  if (!repositoryUrl) {
    return { org: null, url: null };
  }

  const match = repositoryUrl.match(GITHUB_REPO_PATTERN);
  if (match?.[1]) {
    return {
      org: match[1],
      url: repositoryUrl,
    };
  }

  return { org: null, url: repositoryUrl };
}

/**
 * Resolves npm package names to their GitHub organizations.
 * Uses controlled concurrency to avoid rate limiting.
 */
export async function resolveFromNpm(
  names: string[],
  concurrency = 5
): Promise<PackageOrgResult[]> {
  const results: PackageOrgResult[] = [];
  const chunks: string[][] = [];

  // Split into chunks for controlled concurrency
  for (let i = 0; i < names.length; i += concurrency) {
    chunks.push(names.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (packageName) => {
        const pkg = await fetchNpmPackage(packageName);
        if (!pkg) {
          return {
            packageName,
            githubOrg: null,
            repositoryUrl: null,
          };
        }

        const repoUrl =
          typeof pkg.repository === "string"
            ? pkg.repository
            : pkg.repository?.url;
        const { org, url } = extractGitHubOrg(repoUrl);

        return {
          packageName,
          githubOrg: org,
          repositoryUrl: url,
        };
      })
    );
    results.push(...chunkResults);
  }

  return results;
}
