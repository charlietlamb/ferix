import { Schema as S } from "effect";

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Supported agent names as expected by `npx skills add --agent`.
 */
export const AgentNameSchema = S.Literal(
  "opencode",
  "claude-code",
  "cursor",
  "cline",
  "codex",
  "openhands",
  "windsurf"
);
export type AgentName = typeof AgentNameSchema.Type;

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

/**
 * Branded type for npm package names.
 * Ensures we don't accidentally pass arbitrary strings where package names are expected.
 */
export const PackageNameSchema = S.String.pipe(
  S.pattern(/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/),
  S.brand("PackageName")
);
export type PackageName = typeof PackageNameSchema.Type;

/**
 * Branded type for GitHub organization/user names.
 */
export const GitHubOwnerSchema = S.String.pipe(
  S.pattern(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/),
  S.brand("GitHubOwner")
);
export type GitHubOwner = typeof GitHubOwnerSchema.Type;

/**
 * Branded type for GitHub repository names.
 */
export const GitHubRepoSchema = S.String.pipe(
  S.pattern(/^[a-zA-Z0-9._-]+$/),
  S.brand("GitHubRepo")
);
export type GitHubRepo = typeof GitHubRepoSchema.Type;

/**
 * Branded type for GitHub URLs.
 */
export const GitHubUrlSchema = S.String.pipe(
  S.pattern(/^https:\/\/github\.com\/[^/]+\/[^/]+$/),
  S.brand("GitHubUrl")
);
export type GitHubUrl = typeof GitHubUrlSchema.Type;

// ============================================================================
// Domain Schemas
// ============================================================================

/**
 * A skill repository found in the directories table.
 */
export const SkillRepoSchema = S.Struct({
  owner: S.String,
  repo: S.String,
  githubUrl: S.String,
});
export type SkillRepo = typeof SkillRepoSchema.Type;

/**
 * A package with its resolved GitHub organization.
 */
export const PackageOrgSchema = S.Struct({
  packageName: S.String,
  githubOrg: S.NullOr(S.String),
});
export type PackageOrg = typeof PackageOrgSchema.Type;

/**
 * Schema for validating arrays of PackageOrg from Convex.
 */
export const PackageOrgsResponseSchema = S.Array(PackageOrgSchema);

/**
 * Schema for validating arrays of SkillRepo from Convex.
 */
export const SkillReposResponseSchema = S.Array(SkillRepoSchema);

// ============================================================================
// Package.json Schema
// ============================================================================

/**
 * Schema for dependency version strings.
 * Allows semver, workspace:, file:, link:, git URLs, etc.
 */
export const DependencyVersionSchema = S.String;

/**
 * Schema for the dependencies object in package.json.
 */
export const DependenciesSchema = S.Record({
  key: S.String,
  value: DependencyVersionSchema,
});

/**
 * Schema for workspaces field in package.json.
 * Supports both array format and object format with packages key.
 */
export const WorkspacesSchema = S.Union(
  S.Array(S.String),
  S.Struct({ packages: S.Array(S.String) })
);

/**
 * Schema for package.json structure.
 * Only includes fields we care about for sync.
 */
export const PackageJsonSchema = S.Struct({
  name: S.optional(S.String),
  version: S.optional(S.String),
  dependencies: S.optional(DependenciesSchema),
  devDependencies: S.optional(DependenciesSchema),
  workspaces: S.optional(WorkspacesSchema),
});
export type PackageJson = typeof PackageJsonSchema.Type;

// ============================================================================
// Options and Result Schemas
// ============================================================================

/**
 * Options for the sync operation.
 */
export const SyncOptionsSchema = S.Struct({
  dryRun: S.optional(S.Boolean),
  global: S.optional(S.Boolean),
  dev: S.optional(S.Boolean),
});
export type SyncOptions = typeof SyncOptionsSchema.Type;

/**
 * Options for skill installation.
 */
export const InstallOptionsSchema = S.Struct({
  dryRun: S.optional(S.Boolean),
  global: S.optional(S.Boolean),
  agents: S.optional(S.Array(AgentNameSchema)),
});
export type InstallOptions = typeof InstallOptionsSchema.Type;

/**
 * Result of the sync operation.
 */
export const SyncResultSchema = S.Struct({
  dependencies: S.Array(S.String),
  orgs: S.Array(S.String),
  skillRepos: S.Array(SkillRepoSchema),
  installed: S.Array(S.String),
  packageJsonCount: S.Number,
});
export type SyncResult = typeof SyncResultSchema.Type;

// ============================================================================
// Decoder Functions
// ============================================================================

/**
 * Decode and validate package.json content.
 */
export const decodePackageJson = S.decodeUnknown(PackageJsonSchema);

/**
 * Decode and validate PackageOrg array from Convex response.
 */
export const decodePackageOrgsResponse = S.decodeUnknown(
  PackageOrgsResponseSchema
);

/**
 * Decode and validate SkillRepo array from Convex response.
 */
export const decodeSkillReposResponse = S.decodeUnknown(
  SkillReposResponseSchema
);

// ============================================================================
// Constants
// ============================================================================

/**
 * Production Convex URL for the ferix server.
 */
export const CONVEX_URL_PROD =
  "https://groovy-mallard-649.convex.cloud" as const;

/**
 * Development Convex URL for the ferix server.
 */
export const CONVEX_URL_DEV = "https://majestic-gnu-964.convex.cloud" as const;

/**
 * Get the appropriate Convex URL based on environment.
 */
export const getConvexUrl = (dev?: boolean): string =>
  dev ? CONVEX_URL_DEV : CONVEX_URL_PROD;

/**
 * Dependency version prefixes that should be filtered out (not npm packages).
 */
export const NON_NPM_VERSION_PREFIXES = [
  "workspace:",
  "file:",
  "link:",
  "portal:",
] as const;
