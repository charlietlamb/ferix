import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";

// Parse skills.sh HTML for directory-level install counts (aggregated by owner/repo)
const INSTALLS_REGEX =
  /\\"source\\":\\"([\w-]+)\/([\w.-]+)\\"[^}]*\\"installs\\":(\d+)/g;

// Parse skills.sh HTML for individual skill install counts
// Pattern: "name":"skill-name","source":"owner/repo","installs":123
const SKILL_REGEX =
  /\\"name\\":\\"([^\\"]+)\\",\\"source\\":\\"([^\\"]+)\\",\\"installs\\":(\d+)/g;

/**
 * Fetches install counts from skills.sh and updates all matching directories and prompts.
 * Called by cron job every 10 minutes.
 */
export const syncAllInstalls = internalAction({
  handler: async (ctx) => {
    // Fetch skills.sh homepage (contains all install data)
    const response = await fetch("https://skills.sh", {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
    });

    if (!response.ok) {
      console.error(`Failed to fetch skills.sh: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Parse all install counts into a map: "owner/repo" -> installs (aggregated)
    const directoryInstallsMap = new Map<string, number>();
    for (const match of html.matchAll(INSTALLS_REGEX)) {
      const key = `${match[1]}/${match[2]}`;
      directoryInstallsMap.set(
        key,
        (directoryInstallsMap.get(key) ?? 0) + Number.parseInt(match[3], 10)
      );
    }

    // Parse individual skill install counts: "owner/repo/skillName" -> installs
    const skillInstallsMap = new Map<string, number>();
    for (const match of html.matchAll(SKILL_REGEX)) {
      const skillName = match[1];
      const source = match[2];
      const installs = Number.parseInt(match[3], 10);
      const key = `${source}/${skillName}`;
      skillInstallsMap.set(key, installs);
    }

    if (directoryInstallsMap.size === 0 && skillInstallsMap.size === 0) {
      console.warn("No install data parsed from skills.sh");
      return { success: false, error: "No data parsed" };
    }

    // Update directories with aggregated install counts
    const directoryUpdates = Array.from(directoryInstallsMap.entries()).map(
      ([ownerRepo, installs]) => ({
        ownerRepo,
        installs,
      })
    );

    if (directoryUpdates.length > 0) {
      await ctx.runMutation(internal.skillsShCache.updateDirectoryInstalls, {
        updates: directoryUpdates,
      });
    }

    // Update individual prompts with their install counts
    // Batch into chunks of 500 to avoid mutation limits
    const skillUpdates = Array.from(skillInstallsMap.entries()).map(
      ([key, installs]) => ({
        key,
        installs,
      })
    );

    const BATCH_SIZE = 500;
    let promptsUpdated = 0;

    for (let i = 0; i < skillUpdates.length; i += BATCH_SIZE) {
      const batch = skillUpdates.slice(i, i + BATCH_SIZE);
      const result = await ctx.runMutation(
        internal.skillsShCache.updatePromptInstalls,
        { updates: batch }
      );
      promptsUpdated += result.updatedCount;
    }

    return {
      success: true,
      directoriesUpdated: directoryUpdates.length,
      promptsUpdated,
      totalSkillsParsed: skillInstallsMap.size,
    };
  },
});

/**
 * Updates directories with install counts from skills.sh.
 * Batched to handle all updates in a single mutation.
 */
export const updateDirectoryInstalls = internalMutation({
  args: {
    updates: v.array(
      v.object({
        ownerRepo: v.string(),
        installs: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const { ownerRepo, installs } of args.updates) {
      const [owner, repo] = ownerRepo.split("/");
      if (!(owner && repo)) {
        continue;
      }

      const githubUrl = `https://github.com/${owner}/${repo}`;
      const directory = await ctx.db
        .query("directories")
        .withIndex("by_githubUrl", (q) => q.eq("githubUrl", githubUrl))
        .first();

      if (directory) {
        await ctx.db.patch(directory._id, {
          totalDownloads: installs,
          installsUpdatedAt: now,
        });
      }
    }
  },
});

/**
 * Updates prompts with individual install counts from skills.sh.
 * Takes an array of { key: "owner/repo/skillName", installs: number }
 * and matches to prompts by directoryId + filePath pattern.
 */
export const updatePromptInstalls = internalMutation({
  args: {
    updates: v.array(
      v.object({
        key: v.string(),
        installs: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let updatedCount = 0;

    // Build a lookup of directories by owner/repo
    const directories = await ctx.db.query("directories").collect();
    const directoryLookup = new Map<
      string,
      { _id: (typeof directories)[0]["_id"] }
    >();
    for (const dir of directories) {
      directoryLookup.set(`${dir.owner}/${dir.repo}`, { _id: dir._id });
    }

    for (const { key, installs } of args.updates) {
      // Parse key: "owner/repo/skillName"
      const parts = key.split("/");
      if (parts.length < 3) {
        continue;
      }

      const owner = parts[0];
      const repo = parts[1];
      const skillName = parts.slice(2).join("/"); // Handle skill names with slashes
      const ownerRepo = `${owner}/${repo}`;

      const directory = directoryLookup.get(ownerRepo);
      if (!directory) {
        continue;
      }

      // Match prompt by directoryId + filePath pattern: "skillName/SKILL.md"
      const filePath = `${skillName}/SKILL.md`;
      const prompt = await ctx.db
        .query("prompts")
        .withIndex("by_directoryId_filePath", (q) =>
          q.eq("directoryId", directory._id).eq("filePath", filePath)
        )
        .first();

      if (prompt) {
        await ctx.db.patch(prompt._id, {
          downloads: installs,
          installsUpdatedAt: now,
        });
        updatedCount++;
      }
    }

    return { updatedCount };
  },
});
