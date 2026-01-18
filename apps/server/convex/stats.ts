import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const STATS_KEY = "global";

export const getStats = query({
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

export const countByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("stats")
      .withIndex("by_key", (q) => q.eq("key", STATS_KEY))
      .first();

    if (cached?.tagCounts) {
      const counts: Record<string, number> = {};
      for (const tag of args.tags) {
        counts[tag] = (cached.tagCounts as Record<string, number>)[tag] ?? 0;
      }
      return counts;
    }

    const counts: Record<string, number> = {};
    for (const tag of args.tags) {
      counts[tag] = 0;
    }
    return counts;
  },
});

export const refreshStats = internalMutation({
  handler: async (ctx) => {
    const allPrompts = await ctx.db.query("prompts").collect();

    const totalPrompts = allPrompts.length;
    const totalDownloads = allPrompts.reduce(
      (sum, p) => sum + (p.downloads ?? 0),
      0
    );

    const uniqueCreators = new Set(
      allPrompts.map((p) => p.userId).filter(Boolean)
    );
    const totalCreators = uniqueCreators.size;

    const tagCounts: Record<string, number> = {};
    for (const prompt of allPrompts) {
      for (const tag of prompt.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
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
