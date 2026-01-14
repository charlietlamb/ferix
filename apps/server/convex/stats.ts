import { v } from "convex/values";
import { query } from "./_generated/server";

export const getStats = query({
  handler: async (ctx) => {
    const allPrompts = await ctx.db.query("prompts").collect();

    const totalPrompts = allPrompts.length;
    const totalDownloads = allPrompts.reduce(
      (sum, p) => sum + (p.downloads ?? 0),
      0
    );

    const uniqueCreators = new Set(allPrompts.map((p) => p.userId));
    const totalCreators = uniqueCreators.size;

    return {
      totalPrompts,
      totalDownloads,
      totalCreators,
    };
  },
});

export const countByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    const allPrompts = await ctx.db.query("prompts").collect();

    const counts: Record<string, number> = {};
    for (const tag of args.tags) {
      counts[tag] = allPrompts.filter((p) => p.tags.includes(tag)).length;
    }

    return counts;
  },
});
