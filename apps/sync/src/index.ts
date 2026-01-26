import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Effect, Schema as S } from "effect";
import {
  PackageJsonError,
  SchemaValidationError,
  type SyncError,
} from "./errors.js";
import { findSkillRepos } from "./find-skills.js";
import { installSkills } from "./install-skills.js";
import { resolvePackageOrgs } from "./resolve-orgs.js";
import {
  NON_NPM_VERSION_PREFIXES,
  type PackageJson,
  PackageJsonSchema,
  type SkillRepo,
  type SyncOptions,
  type SyncResult,
} from "./types.js";

// Re-export types and individual functions for granular use
export * from "./detect-agents.js";
export * from "./errors.js";
export { findSkillRepos } from "./find-skills.js";
export { installSkills } from "./install-skills.js";
export { resolvePackageOrgs } from "./resolve-orgs.js";
export * from "./types.js";

/**
 * Validates that a file exists and is readable.
 */
const validateFileExists = (
  filePath: string
): Effect.Effect<string, PackageJsonError> =>
  Effect.tryPromise({
    try: async () => {
      const absolutePath = resolve(filePath);
      await access(absolutePath);
      return absolutePath;
    },
    catch: () =>
      new PackageJsonError({
        message: `File not found: ${filePath}`,
        path: filePath,
      }),
  });

/**
 * Reads a file and returns its contents as a string.
 */
const readFileContent = (
  absolutePath: string
): Effect.Effect<string, PackageJsonError> =>
  Effect.tryPromise({
    try: async () => await readFile(absolutePath, "utf-8"),
    catch: (error) =>
      new PackageJsonError({
        message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        path: absolutePath,
        cause: error,
      }),
  });

/**
 * Parses JSON content into an unknown value.
 */
const parseJson = (
  content: string,
  path: string
): Effect.Effect<unknown, PackageJsonError> =>
  Effect.try({
    try: () => JSON.parse(content) as unknown,
    catch: (error) =>
      new PackageJsonError({
        message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        path,
        cause: error,
      }),
  });

/**
 * Validates unknown JSON against the PackageJson schema.
 */
const validatePackageJson = (
  json: unknown,
  path: string
): Effect.Effect<PackageJson, SchemaValidationError> =>
  S.decodeUnknown(PackageJsonSchema)(json).pipe(
    Effect.mapError(
      (error) =>
        new SchemaValidationError({
          message: "Invalid package.json structure",
          context: path,
          cause: error,
        })
    )
  );

/**
 * Checks if a dependency version is a non-npm reference (workspace, file, link).
 */
const isNonNpmDependency = (version: string): boolean =>
  NON_NPM_VERSION_PREFIXES.some((prefix) => version.startsWith(prefix));

/**
 * Extracts all dependency names from package.json.
 * Deduplicates and filters out internal workspace dependencies.
 */
const extractDependencies = (pkg: PackageJson): readonly string[] => {
  const deps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  const allDeps = new Map<string, string>();

  // Add all dependencies
  for (const [name, version] of Object.entries(deps)) {
    if (!isNonNpmDependency(version)) {
      allDeps.set(name, version);
    }
  }

  // Add devDependencies (won't overwrite if already present)
  for (const [name, version] of Object.entries(devDeps)) {
    if (!(allDeps.has(name) || isNonNpmDependency(version))) {
      allDeps.set(name, version);
    }
  }

  return Array.from(allDeps.keys());
};

/**
 * Creates an empty sync result for early returns.
 */
const emptyResult = (
  dependencies: readonly string[] = [],
  orgs: readonly string[] = [],
  packageJsonCount = 1
): SyncResult => ({
  dependencies: [...dependencies],
  orgs: [...orgs],
  skillRepos: [],
  installed: [],
  packageJsonCount,
});

/**
 * Converts a readonly SkillRepo array to a mutable SyncResult-compatible array.
 */
const toMutableSkillRepos = (
  repos: readonly SkillRepo[]
): Array<{ owner: string; repo: string; githubUrl: string }> =>
  repos.map((r) => ({ owner: r.owner, repo: r.repo, githubUrl: r.githubUrl }));

/**
 * Extracts workspace patterns from package.json.
 * Supports both array format and object format with packages key.
 */
const extractWorkspacePatterns = (pkg: PackageJson): string[] => {
  const workspaces = pkg.workspaces;
  if (!workspaces) {
    return [];
  }

  // Array format: "workspaces": ["apps/*", "packages/*"]
  if (Array.isArray(workspaces)) {
    return workspaces.filter((w): w is string => typeof w === "string");
  }

  // Object format: "workspaces": { "packages": ["apps/*", "packages/*"] }
  if (typeof workspaces === "object" && "packages" in workspaces) {
    const packages = workspaces.packages;
    if (Array.isArray(packages)) {
      return packages.filter((w): w is string => typeof w === "string");
    }
  }

  return [];
};

/**
 * Expands a glob pattern like "apps/*" to actual directories.
 * Only handles simple patterns with trailing /* for now.
 */
const expandGlobPattern = async (
  rootDir: string,
  pattern: string
): Promise<string[]> => {
  // Handle simple glob patterns like "apps/*" or "packages/*"
  if (pattern.endsWith("/*")) {
    const baseDir = pattern.slice(0, -2);
    const fullPath = join(rootDir, baseDir);

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(fullPath, entry.name));
    } catch {
      // Directory doesn't exist, return empty
      return [];
    }
  }

  // Handle patterns like "apps/**" (treat same as "apps/*")
  if (pattern.endsWith("/**")) {
    const baseDir = pattern.slice(0, -3);
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

  // Direct path (no glob)
  const fullPath = join(rootDir, pattern);
  try {
    await access(fullPath);
    return [fullPath];
  } catch {
    return [];
  }
};

/**
 * Discovers all package.json files in a monorepo.
 * Returns paths to all package.json files found in workspace packages.
 */
const discoverPackageJsonFiles = (
  rootPath: string,
  rootPkg: PackageJson
): Effect.Effect<string[], PackageJsonError> =>
  Effect.tryPromise({
    try: async () => {
      const rootDir = dirname(rootPath);
      const patterns = extractWorkspacePatterns(rootPkg);

      // If no workspaces, just return the root package.json
      if (patterns.length === 0) {
        return [rootPath];
      }

      const packageJsonPaths: string[] = [rootPath];

      // Expand each pattern and check for package.json
      for (const pattern of patterns) {
        const dirs = await expandGlobPattern(rootDir, pattern);

        for (const dir of dirs) {
          const pkgPath = join(dir, "package.json");
          try {
            await access(pkgPath);
            packageJsonPaths.push(pkgPath);
          } catch {
            // No package.json in this directory, skip
          }
        }
      }

      return packageJsonPaths;
    },
    catch: (error) =>
      new PackageJsonError({
        message: `Failed to discover workspace packages: ${error instanceof Error ? error.message : String(error)}`,
        path: rootPath,
        cause: error,
      }),
  });

/**
 * Reads and parses a package.json file.
 */
const readPackageJson = (
  filePath: string
): Effect.Effect<PackageJson, PackageJsonError | SchemaValidationError> =>
  Effect.gen(function* () {
    const content = yield* readFileContent(filePath);
    const json = yield* parseJson(content, filePath);
    return yield* validatePackageJson(json, filePath);
  });

/**
 * Main sync function that orchestrates the full pipeline:
 * 1. Discover all package.json files (monorepo support)
 * 2. Extract and filter dependencies from all packages
 * 3. Resolve npm packages to GitHub organizations
 * 4. Find skill repositories for those organizations
 * 5. Install the skills (unless dry run)
 *
 * @param packageJsonPath - Path to the root package.json file
 * @param options - Sync options (dryRun, global, dev)
 * @returns Effect that resolves to SyncResult with details of the operation
 */
export const sync = (
  packageJsonPath: string,
  options: SyncOptions = {}
): Effect.Effect<SyncResult, SyncError> =>
  Effect.gen(function* () {
    // Step 1: Validate root package.json exists
    const absolutePath = yield* validateFileExists(packageJsonPath);

    // Step 2: Read and parse root package.json
    const rootPkg = yield* readPackageJson(absolutePath);

    // Step 3: Discover all package.json files in the monorepo
    const packageJsonPaths = yield* discoverPackageJsonFiles(
      absolutePath,
      rootPkg
    );
    const packageJsonCount = packageJsonPaths.length;

    // Step 4: Extract dependencies from ALL package.json files
    const allDependencies = new Set<string>();

    for (const pkgPath of packageJsonPaths) {
      const pkg = yield* readPackageJson(pkgPath);
      const deps = extractDependencies(pkg);
      for (const dep of deps) {
        allDependencies.add(dep);
      }
    }

    const dependencies = Array.from(allDependencies);

    if (dependencies.length === 0) {
      return emptyResult([], [], packageJsonCount);
    }

    // Step 5: Resolve package names to GitHub organizations
    const packageOrgs = yield* resolvePackageOrgs(dependencies, options.dev);

    // Extract unique orgs (filter out nulls)
    const orgs = Array.from(
      new Set(
        packageOrgs
          .map((p) => p.githubOrg)
          .filter((org): org is string => org !== null)
      )
    );

    if (orgs.length === 0) {
      return emptyResult([...dependencies], [], packageJsonCount);
    }

    // Step 6: Find skill repositories for the resolved organizations
    const skillRepos = yield* findSkillRepos(orgs, options.dev);

    if (skillRepos.length === 0) {
      return emptyResult([...dependencies], orgs, packageJsonCount);
    }

    // Step 7: Install skills (unless dry run)
    const installed = yield* installSkills(skillRepos, {
      dryRun: options.dryRun,
      global: options.global,
    });

    return {
      dependencies: [...dependencies],
      orgs,
      skillRepos: toMutableSkillRepos(skillRepos),
      installed: [...installed],
      packageJsonCount,
    };
  });
