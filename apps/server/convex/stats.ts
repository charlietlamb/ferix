import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const STATS_KEY = "global";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("stats")
      .withIndex("by_key", (q) => q.eq("key", STATS_KEY))
      .first();

    if (cached) {
      return {
        totalPrompts: cached.totalPrompts,
        totalDownloads: cached.totalDownloads,
        totalCreators: cached.totalCreators,
      };
    }

    return {
      totalPrompts: 0,
      totalDownloads: 0,
      totalCreators: 0,
    };
  },
});

/**
 * Counts prompts by tags using cached stats.
 * Falls back to computing if no cached stats exist.
 */
export const countByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("stats")
      .withIndex("by_key", (q) => q.eq("key", STATS_KEY))
      .first();

    const counts: Record<string, number> = {};

    if (cached?.tagCounts) {
      const cachedTagCounts = cached.tagCounts as Record<string, number>;
      for (const tag of args.tags) {
        counts[tag] = cachedTagCounts[tag] ?? 0;
      }
      return counts;
    }

    for (const tag of args.tags) {
      const entries = await ctx.db
        .query("promptTags")
        .withIndex("by_tag_promptId", (q) => q.eq("tag", tag))
        .take(1000);
      counts[tag] = entries.length;
    }

    return counts;
  },
});

/**
 * Refreshes global stats by aggregating userStats and promptTags.
 * Uses .take() with high limits since Convex only allows one paginated query per function.
 */
export const refreshStats = internalMutation({
  handler: async (ctx) => {
    let totalPrompts = 0;
    let totalDownloads = 0;
    let totalCreators = 0;
    const tagCounts: Record<string, number> = {};

    const userStats = await ctx.db.query("userStats").take(10_000);

    for (const stat of userStats) {
      totalPrompts += stat.promptCount;
      totalDownloads += stat.totalDownloads;
      if (stat.promptCount > 0) {
        totalCreators++;
      }
    }

    const promptTags = await ctx.db.query("promptTags").take(50_000);

    for (const pt of promptTags) {
      tagCounts[pt.tag] = (tagCounts[pt.tag] ?? 0) + 1;
    }

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_key", (q) => q.eq("key", STATS_KEY))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalPrompts,
        totalDownloads,
        totalCreators,
        tagCounts,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("stats", {
        key: STATS_KEY,
        totalPrompts,
        totalDownloads,
        totalCreators,
        tagCounts,
        updatedAt: Date.now(),
      });
    }
  },
});

export const countByDirectories = query({
  args: { directoryIds: v.array(v.id("directories")) },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};
    for (const directoryId of args.directoryIds) {
      const directory = await ctx.db.get(directoryId);
      counts[directoryId] = directory?.promptCount ?? 0;
    }
    return counts;
  },
});
