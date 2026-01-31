import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NON_NPM_VERSION_PREFIXES } from "./types.js";

// ============================================================================
// Package.json Types
// ============================================================================

interface PackageJsonRaw {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

// ============================================================================
// Dependency Extraction
// ============================================================================

const isNonNpmDependency = (version: string): boolean =>
  NON_NPM_VERSION_PREFIXES.some((prefix) => version.startsWith(prefix));

export const extractDependencies = (pkg: PackageJsonRaw): readonly string[] => {
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};
  const allDeps = new Map<string, string>();

  for (const [name, version] of Object.entries(deps)) {
    if (!isNonNpmDependency(version)) {
      allDeps.set(name, version);
    }
  }
  for (const [name, version] of Object.entries(devDeps)) {
    if (!(allDeps.has(name) || isNonNpmDependency(version))) {
      allDeps.set(name, version);
    }
  }
  return Array.from(allDeps.keys());
};

// ============================================================================
// Workspace Pattern Extraction
// ============================================================================

const extractWorkspacePatterns = (pkg: PackageJsonRaw): string[] => {
  const workspaces = pkg.workspaces;
  if (!workspaces) {
    return [];
  }
  if (Array.isArray(workspaces)) {
    return workspaces.filter((w): w is string => typeof w === "string");
  }
  if (typeof workspaces === "object" && "packages" in workspaces) {
    const packages = workspaces.packages;
    if (Array.isArray(packages)) {
      return packages.filter((w): w is string => typeof w === "string");
    }
  }
  return [];
};

// ============================================================================
// Glob Pattern Expansion
// ============================================================================

const GLOB_SUFFIX_PATTERN = /\/\*+$/;

const expandGlobPattern = async (
  rootDir: string,
  pattern: string
): Promise<string[]> => {
  if (pattern.endsWith("/*") || pattern.endsWith("/**")) {
    const baseDir = pattern.replace(GLOB_SUFFIX_PATTERN, "");
    const fullPath = join(rootDir, baseDir);
    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(fullPath, entry.name));
    } catch {
      return [];
    }
  }
  const fullPath = join(rootDir, pattern);
  try {
    await access(fullPath);
    return [fullPath];
  } catch {
    return [];
  }
};

// ============================================================================
// Package.json Reading
// ============================================================================

export const readPackageJsonFile = async (
  filePath: string
): Promise<PackageJsonRaw> => {
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as PackageJsonRaw;
};

export const discoverPackageJsonFiles = async (
  rootPath: string,
  rootPkg: PackageJsonRaw
): Promise<string[]> => {
  const rootDir = dirname(rootPath);
  const patterns = extractWorkspacePatterns(rootPkg);

  if (patterns.length === 0) {
    return [rootPath];
  }

  const packageJsonPaths: string[] = [rootPath];

  for (const pattern of patterns) {
    const dirs = await expandGlobPattern(rootDir, pattern);
    for (const dir of dirs) {
      const pkgPath = join(dir, "package.json");
      try {
        await access(pkgPath);
        packageJsonPaths.push(pkgPath);
      } catch {
        // No package.json in this directory
      }
    }
  }
  return packageJsonPaths;
};
