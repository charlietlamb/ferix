import { Schema as S } from "effect";

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Supported agent names as expected by `npx skills add --agent`.
 */
const AgentNameSchema = S.Literal(
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
// Domain Schemas
// ============================================================================

/**
 * A skill repository found in the directories table.
 */
const SkillRepoSchema = S.Struct({
  owner: S.String,
  repo: S.String,
  githubUrl: S.String,
});
export type SkillRepo = typeof SkillRepoSchema.Type;

/**
 * A package with its resolved GitHub organization.
 */
const PackageOrgSchema = S.Struct({
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

/**
 * Options for skill installation.
 */
const InstallOptionsSchema = S.Struct({
  dryRun: S.optional(S.Boolean),
  global: S.optional(S.Boolean),
  agents: S.optional(S.Array(AgentNameSchema)),
});
export type InstallOptions = typeof InstallOptionsSchema.Type;

// ============================================================================
// Constants
// ============================================================================

/**
 * Production Convex URL for the ferix server.
 */
const CONVEX_URL_PROD = "https://groovy-mallard-649.convex.cloud" as const;

/**
 * Development Convex URL for the ferix server.
 */
const CONVEX_URL_DEV = "https://majestic-gnu-964.convex.cloud" as const;

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
