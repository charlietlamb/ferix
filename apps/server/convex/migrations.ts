/**
 * Migration functions for database optimizations.
 *
 * @example Running migrations
 * ```bash
 * # Deploy schema changes first
 * npx convex deploy
 *
 * # Run all migrations
 * npx convex run migrations:runAllMigrations
 *
 * # Or run individually
 * npx convex run migrations:backfillPromptTags
 * npx convex run migrations:backfillUserStats
 * ```
 *
 * @example Rollback
 * ```bash
 * npx convex run migrations:clearPromptTags
 * npx convex run migrations:clearUserStats
 * ```
 */

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const BATCH_SIZE = 100;

/**
 * Backfills the promptTags junction table from existing prompts.
 * Use: npx convex run migrations:backfillPromptTags
 */
export const backfillPromptTags = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.backfillPromptTagsBatch,
      { cursor: null }
    );

    return { message: "Migration started. Check logs for progress." };
  },
});

/**
 * Internal batch processor for promptTags backfill.
 * Processes BATCH_SIZE prompts at a time, scheduling itself for continuation.
 */
export const backfillPromptTagsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("prompts")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    let tagsCreated = 0;

    for (const prompt of results.page) {
      const existingTags = await ctx.db
        .query("promptTags")
        .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
        .first();

      if (existingTags) {
        continue;
      }

      for (const tag of prompt.tags) {
        await ctx.db.insert("promptTags", {
          promptId: prompt._id,
          tag,
        });
        tagsCreated++;
      }
    }

    console.log(
      `[Migration] Processed ${results.page.length} prompts, created ${tagsCreated} tag entries`
    );

    if (results.isDone) {
      console.log("[Migration] promptTags backfill complete!");
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.backfillPromptTagsBatch,
        { cursor: results.continueCursor }
      );
    }
  },
});

/**
 * Clears the promptTags table for rollback or re-migration.
 * Use: npx convex run migrations:clearPromptTags
 */
export const clearPromptTags = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.migrations.clearPromptTagsBatch, {
      cursor: null,
    });

    return { message: "Clear started. Check logs for progress." };
  },
});

/**
 * Internal batch processor for promptTags clear.
 */
export const clearPromptTagsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("promptTags")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    for (const tag of results.page) {
      await ctx.db.delete(tag._id);
    }

    console.log(
      `[Migration] Deleted ${results.page.length} promptTags entries`
    );

    if (results.isDone) {
      console.log("[Migration] promptTags clear complete!");
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.clearPromptTagsBatch,
        { cursor: results.continueCursor }
      );
    }
  },
});

/**
 * Backfills the userStats table from existing prompts.
 * Use: npx convex run migrations:backfillUserStats
 */
export const backfillUserStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.backfillUserStatsBatch,
      { cursor: null, userStatsMap: {} }
    );

    return { message: "Migration started. Check logs for progress." };
  },
});

/**
 * Internal batch processor for userStats backfill.
 * Accumulates stats across batches and writes all at the end.
 */
export const backfillUserStatsBatch = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    userStatsMap: v.any(),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("prompts")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    const statsMap: Record<
      string,
      { promptCount: number; totalDownloads: number }
    > = args.userStatsMap;

    for (const prompt of results.page) {
      if (!prompt.userId) {
        continue;
      }

      if (!statsMap[prompt.userId]) {
        statsMap[prompt.userId] = { promptCount: 0, totalDownloads: 0 };
      }

      const userStats = statsMap[prompt.userId];
      if (userStats) {
        userStats.promptCount++;
        userStats.totalDownloads += prompt.downloads ?? 0;
      }
    }

    console.log(
      `[Migration] Processed ${results.page.length} prompts for user stats`
    );

    if (results.isDone) {
      const userIds = Object.keys(statsMap);
      for (const userId of userIds) {
        const stats = statsMap[userId];
        if (!stats) {
          continue;
        }

        const existing = await ctx.db
          .query("userStats")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            promptCount: stats.promptCount,
            totalDownloads: stats.totalDownloads,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("userStats", {
            userId,
            promptCount: stats.promptCount,
            totalDownloads: stats.totalDownloads,
            updatedAt: Date.now(),
          });
        }
      }

      console.log(
        `[Migration] userStats backfill complete! Created/updated ${userIds.length} user stats`
      );
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.backfillUserStatsBatch,
        { cursor: results.continueCursor, userStatsMap: statsMap }
      );
    }
  },
});

/**
 * Clears the userStats table for rollback or re-migration.
 * Use: npx convex run migrations:clearUserStats
 */
export const clearUserStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.migrations.clearUserStatsBatch, {
      cursor: null,
    });

    return { message: "Clear started. Check logs for progress." };
  },
});

/**
 * Internal batch processor for userStats clear.
 */
export const clearUserStatsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("userStats")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    for (const stat of results.page) {
      await ctx.db.delete(stat._id);
    }

    console.log(`[Migration] Deleted ${results.page.length} userStats entries`);

    if (results.isDone) {
      console.log("[Migration] userStats clear complete!");
    } else {
      await ctx.scheduler.runAfter(0, internal.migrations.clearUserStatsBatch, {
        cursor: results.continueCursor,
      });
    }
  },
});

/**
 * Backfills the saveCount field on prompts from existing saves.
 * Use: npx convex run migrations:backfillSaveCount
 */
export const backfillSaveCount = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.backfillSaveCountBatch,
      { cursor: null }
    );

    return { message: "Migration started. Check logs for progress." };
  },
});

/**
 * Internal batch processor for saveCount backfill.
 */
export const backfillSaveCountBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("prompts")
      .paginate({ numItems: BATCH_SIZE, cursor: args.cursor });

    let updated = 0;

    for (const prompt of results.page) {
      const saves = await ctx.db
        .query("saves")
        .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
        .take(10_000);

      const saveCount = saves.length;

      if (prompt.saveCount !== saveCount) {
        await ctx.db.patch(prompt._id, { saveCount });
        updated++;
      }
    }

    console.log(
      `[Migration] Processed ${results.page.length} prompts, updated ${updated} save counts`
    );

    if (results.isDone) {
      console.log("[Migration] saveCount backfill complete!");
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.backfillSaveCountBatch,
        { cursor: results.continueCursor }
      );
    }
  },
});

/**
 * Runs all migrations in sequence.
 * Use: npx convex run migrations:runAllMigrations
 */
export const runAllMigrations = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.migrations.backfillPromptTagsBatch,
      { cursor: null }
    );

    await ctx.scheduler.runAfter(
      100,
      internal.migrations.backfillUserStatsBatch,
      { cursor: null, userStatsMap: {} }
    );

    await ctx.scheduler.runAfter(
      200,
      internal.migrations.backfillSaveCountBatch,
      { cursor: null }
    );

    return {
      message: "All migrations started. Check logs for progress.",
      migrations: [
        "backfillPromptTags",
        "backfillUserStats",
        "backfillSaveCount",
      ],
    };
  },
});
