import { cn } from "@ferix/ui/lib/utils";

export type McpRegistryType = "npm" | "pypi" | "oci" | "nuget";
export type McpTransportType = "stdio" | "sse" | "streamable-http";

export interface McpPackage {
  registryType: McpRegistryType;
  identifier: string;
  transport: McpTransportType;
}

export interface McpServerBase {
  _id: string;
  name: string;
  title: string;
  description?: string;
  version: string;
  repositoryUrl?: string;
  websiteUrl?: string;
  iconUrl?: string;
  packages: McpPackage[];
  githubStars?: number;
  registryUpdatedAt: number;
  publishedAt?: number;
  lastSyncedAt?: number;
}

/**
 * Get the display name for an MCP server.
 * Uses the title, or falls back to the name.
 */
export function getMcpDisplayName(server: {
  title?: string;
  name: string;
}): string {
  return server.title?.trim() || server.name;
}

/**
 * Format GitHub stars count for display.
 */
export function formatStars(stars: number | undefined): string {
  if (stars === undefined || stars === null) {
    return "—";
  }
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

/**
 * Get the primary package type for display.
 */
export function getPrimaryPackageType(
  packages: Array<{ registryType: McpRegistryType }>
): McpRegistryType | null {
  if (packages.length === 0) {
    return null;
  }
  return packages[0].registryType;
}

/**
 * Get the install command for a package based on its registry type.
 */
export function getInstallCommand(pkg: McpPackage): string {
  switch (pkg.registryType) {
    case "npm":
      return `npx ${pkg.identifier}`;
    case "pypi":
      return `uvx ${pkg.identifier}`;
    case "oci":
      return `docker pull ${pkg.identifier}`;
    case "nuget":
      return `dotnet add package ${pkg.identifier}`;
    default:
      return pkg.identifier;
  }
}

/**
 * Get a human-readable description for a transport type.
 */
export function getTransportDescription(transport: McpTransportType): string {
  switch (transport) {
    case "stdio":
      return "Standard I/O";
    case "sse":
      return "Server-Sent Events";
    case "streamable-http":
      return "Streamable HTTP";
    default:
      return transport;
  }
}

/**
 * Get all unique registry types from a server's packages.
 */
export function getRegistryTypes(packages: McpPackage[]): McpRegistryType[] {
  return [...new Set(packages.map((pkg) => pkg.registryType))];
}

/**
 * Get all unique transport types from a server's packages.
 */
export function getTransportTypes(packages: McpPackage[]): McpTransportType[] {
  return [...new Set(packages.map((pkg) => pkg.transport))];
}

/**
 * Get grid item border classes for MCP server grid.
 */
export function getMcpGridItemBorderClasses(
  index: number,
  totalItems: number,
  options?: {
    colsMobile?: number;
    colsDesktop?: number;
    alwaysShowBottomBorder?: boolean;
  }
): string {
  const colsMobile = options?.colsMobile ?? 2;
  const colsDesktop = options?.colsDesktop ?? 4;
  const alwaysShowBottomBorder = options?.alwaysShowBottomBorder ?? false;

  const lastRowMobile = Math.ceil(totalItems / colsMobile) - 1;
  const lastRowDesktop = Math.ceil(totalItems / colsDesktop) - 1;
  const rowMobile = Math.floor(index / colsMobile);
  const rowDesktop = Math.floor(index / colsDesktop);
  const isLastRowMobile = rowMobile === lastRowMobile;
  const isLastRowDesktop = rowDesktop === lastRowDesktop;

  return cn(
    "border-border",
    index % colsMobile !== colsMobile - 1 && "max-md:border-r",
    index % colsDesktop !== colsDesktop - 1 && "md:border-r",
    (alwaysShowBottomBorder || !isLastRowMobile) && "max-md:border-b",
    (alwaysShowBottomBorder || !isLastRowDesktop) && "md:border-b"
  );
}
