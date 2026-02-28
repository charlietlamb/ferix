// MCP Registry API client for registry.modelcontextprotocol.io

const MCP_REGISTRY_BASE = "https://registry.modelcontextprotocol.io/v0.1";

// GitHub URL patterns for parsing
const GITHUB_HTTPS_PATTERN =
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/;
const GITHUB_SSH_PATTERN = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/;
const GIT_SUFFIX_PATTERN = /\.git$/;

// The registry key where official metadata is stored
const REGISTRY_META_KEY = "io.modelcontextprotocol.registry/official";

/**
 * Package info - transport is a nested object in the API response.
 */
export interface McpPackageRaw {
  registryType: "npm" | "pypi" | "oci" | "nuget";
  identifier: string;
  transport?: { type: "stdio" | "sse" | "streamable-http" };
}

/**
 * Server data as nested inside the container object from the API.
 */
export interface McpServerData {
  name: string;
  title?: string;
  description?: string;
  version: string;
  repository?: { url: string; source?: string };
  websiteUrl?: string;
  icons?: Array<{ url: string }>;
  packages?: McpPackageRaw[];
}

/**
 * Registry metadata stored under _meta key.
 */
export interface McpRegistryMeta {
  status: string;
  publishedAt: string;
  updatedAt: string;
  isLatest?: boolean;
}

/**
 * The API wraps each server in a container object with server data and metadata.
 */
export interface McpServerContainer {
  server: McpServerData;
  _meta: {
    "io.modelcontextprotocol.registry/official": McpRegistryMeta;
  };
}

export interface McpListResponse {
  servers: McpServerContainer[];
  metadata: {
    nextCursor?: string;
    count: number;
  };
}

export interface FetchServersOptions {
  cursor?: string;
  search?: string;
  updatedSince?: string;
  limit?: number;
}

/**
 * Fetches servers from the MCP Registry API with pagination support.
 */
export async function fetchServers(
  options?: FetchServersOptions
): Promise<McpListResponse> {
  const params = new URLSearchParams();

  if (options?.cursor) {
    params.set("cursor", options.cursor);
  }
  if (options?.search) {
    params.set("search", options.search);
  }
  if (options?.updatedSince) {
    params.set("updated_since", options.updatedSince);
  }
  if (options?.limit) {
    params.set("limit", options.limit.toString());
  }

  const url = `${MCP_REGISTRY_BASE}/servers${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Ferix-MCP-Sync",
    },
  });

  if (!response.ok) {
    throw new Error(`MCP Registry API error: ${response.status}`);
  }

  return response.json() as Promise<McpListResponse>;
}

/**
 * Parses a GitHub URL and extracts owner and repo.
 * Supports various GitHub URL formats.
 */
export function parseGitHubUrl(
  url: string
): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo.git
  // - git@github.com:owner/repo.git
  // - https://github.com/owner/repo/tree/branch
  // - https://github.com/owner/repo/blob/branch/file

  const patterns = [GITHUB_HTTPS_PATTERN, GITHUB_SSH_PATTERN];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1] && match[2]) {
      return {
        owner: match[1],
        repo: match[2].replace(GIT_SUFFIX_PATTERN, ""),
      };
    }
  }

  return null;
}

/**
 * Transforms an MCP server container from the registry format to our database format.
 * The API returns servers wrapped in a container with nested server data and _meta.
 */
export function transformMcpServer(container: McpServerContainer) {
  const server = container.server;
  const meta = container._meta[REGISTRY_META_KEY];

  const repoUrl = server.repository?.url;
  const github = repoUrl ? parseGitHubUrl(repoUrl) : null;

  // Parse dates safely - handle invalid dates by falling back to current time
  const publishedAtDate = new Date(meta.publishedAt);
  const updatedAtDate = new Date(meta.updatedAt);
  const publishedAt = Number.isNaN(publishedAtDate.getTime())
    ? Date.now()
    : publishedAtDate.getTime();
  const registryUpdatedAt = Number.isNaN(updatedAtDate.getTime())
    ? Date.now()
    : updatedAtDate.getTime();

  return {
    name: server.name,
    title: server.title ?? server.name,
    description: server.description,
    version: server.version,
    repositoryUrl: repoUrl,
    websiteUrl: server.websiteUrl,
    iconUrl: server.icons?.[0]?.url,
    packages: (server.packages ?? []).map((pkg) => ({
      registryType: pkg.registryType,
      identifier: pkg.identifier,
      // Transport is now a nested object with { type: string }
      transport: pkg.transport?.type ?? ("stdio" as const),
    })),
    registryStatus: meta.status,
    publishedAt,
    registryUpdatedAt,
    githubOwner: github?.owner,
    githubRepo: github?.repo,
  };
}
