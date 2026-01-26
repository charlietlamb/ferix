import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Effect } from "effect";
import { SkillInstallError } from "./errors.js";
import type { InstallOptions, SkillRepo } from "./types.js";

const execAsync = promisify(exec);

/**
 * Installs a single skill repository using npx skills add.
 */
const installSingleSkill = (
  repo: SkillRepo,
  options: InstallOptions
): Effect.Effect<string, SkillInstallError> =>
  Effect.tryPromise({
    try: async () => {
      const repoId = `${repo.owner}/${repo.repo}`;
      const globalFlag = options.global === true ? " --global" : "";
      const agentFlag =
        options.agents && options.agents.length > 0
          ? ` --agent ${options.agents.join(" ")}`
          : "";
      const command = `npx skills add ${repoId}${globalFlag}${agentFlag} --yes`;
      await execAsync(command);
      return repoId;
    },
    catch: (error) => {
      const repoId = `${repo.owner}/${repo.repo}`;
      return new SkillInstallError({
        message: `Failed to install skill ${repoId}: ${error instanceof Error ? error.message : String(error)}`,
        repo: repoId,
        cause: error,
      });
    },
  });

/**
 * Installs skill repositories using npx skills add.
 *
 * @param repos - Array of skill repositories to install
 * @param options - Installation options (dryRun, global, agents)
 * @returns Effect that resolves to array of successfully installed repo identifiers
 */
export const installSkills = (
  repos: readonly SkillRepo[],
  options: InstallOptions = {}
): Effect.Effect<readonly string[], SkillInstallError> => {
  // In dry-run mode, just return the repo IDs without installing
  if (options.dryRun === true) {
    return Effect.succeed(repos.map((r) => `${r.owner}/${r.repo}`));
  }

  // Install each skill sequentially to avoid overwhelming the system
  return Effect.forEach(repos, (repo) => installSingleSkill(repo, options), {
    concurrency: 1,
  });
};
