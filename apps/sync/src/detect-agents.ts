import { access } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import type { AgentName } from "./types.js";

/**
 * Mapping of agent names (as expected by `npx skills add --agent`) to their
 * project-level directory patterns.
 */
const AGENT_DIRECTORIES: Record<AgentName, readonly string[]> = {
  opencode: [".opencode"],
  "claude-code": [".claude"],
  cursor: [".cursor"],
  cline: [".cline"],
  codex: [".codex"],
  openhands: [".openhands"],
  windsurf: [".windsurf"],
};

/**
 * All supported agent names.
 */
export const SUPPORTED_AGENTS: readonly AgentName[] = Object.keys(
  AGENT_DIRECTORIES
) as AgentName[];

/**
 * Checks if a directory exists at the given path.
 */
const directoryExists = (dirPath: string): Effect.Effect<boolean, never> =>
  Effect.promise(async () => {
    try {
      await access(dirPath);
      return true;
    } catch {
      return false;
    }
  });

/**
 * Checks if an agent is present by looking for any of its directory patterns.
 */
const isAgentPresent = (
  projectDir: string,
  agent: AgentName
): Effect.Effect<boolean, never> => {
  const directories = AGENT_DIRECTORIES[agent];

  return Effect.forEach(directories, (dir) =>
    directoryExists(join(projectDir, dir))
  ).pipe(Effect.map((results) => results.some((exists) => exists)));
};

/**
 * Detects which coding agents are being used in the project by checking
 * for their configuration directories.
 *
 * @param projectDir - The root directory of the project to scan
 * @returns Effect that resolves to an array of detected agent names
 */
export const detectAgents = (
  projectDir: string
): Effect.Effect<readonly AgentName[], never> =>
  Effect.forEach(SUPPORTED_AGENTS, (agent) =>
    isAgentPresent(projectDir, agent).pipe(
      Effect.map((present) => (present ? agent : null))
    )
  ).pipe(
    Effect.map((results) =>
      results.filter((agent): agent is AgentName => agent !== null)
    )
  );

/**
 * Validates that provided agent names are all supported.
 * Returns an array of invalid agent names (empty if all valid).
 *
 * @param agents - Array of agent names to validate
 * @returns Array of invalid agent names
 */
export const validateAgentNames = (agents: readonly string[]): string[] =>
  agents.filter((agent) => !SUPPORTED_AGENTS.includes(agent as AgentName));

/**
 * Type guard to check if an array of strings are all valid agent names.
 *
 * @param agents - Array of strings to check
 * @returns True if all strings are valid agent names
 */
export const isValidAgentNames = (
  agents: readonly string[]
): agents is AgentName[] => validateAgentNames(agents).length === 0;
