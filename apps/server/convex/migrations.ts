import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";

export const migrations = new Migrations(components.migrations);

export const run = migrations.runner();

export const populateDirectoryCounts = migrations.define({
  table: "directories",
  batchSize: 10,
  migrateOne: async (ctx, doc) => {
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId", (q) => q.eq("directoryId", doc._id))
      .collect();

    const promptCount = prompts.length;
    let totalDownloads = 0;
    for (const p of prompts) {
      totalDownloads += (p.downloads as number) ?? 0;
    }

    await ctx.db.patch(doc._id, { promptCount, totalDownloads });
  },
});
