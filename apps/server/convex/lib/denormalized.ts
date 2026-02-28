/**
 * Helper functions for maintaining denormalized data structures.
 * These functions handle the junction tables and cached stats to avoid expensive full table scans.
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const MAX_TAGS_PER_PROMPT = 20;

/**
 * Syncs the promptTags junction table for a prompt.
 * Compares existing tags with new tags and performs minimal inserts/deletes.
 * Limited to MAX_TAGS_PER_PROMPT to bound operations.
 */
export async function syncPromptTags(
  ctx: MutationCtx,
  promptId: Id<"prompts">,
  newTags: string[]
) {
  const existingTagDocs = await ctx.db
    .query("promptTags")
    .withIndex("by_promptId", (q) => q.eq("promptId", promptId))
    .take(MAX_TAGS_PER_PROMPT);

  const existingTags = new Set(existingTagDocs.map((t) => t.tag));
  const newTagsSet = new Set(newTags);

  const toDelete = existingTagDocs.filter((t) => !newTagsSet.has(t.tag));
  const toInsert = newTags.filter((t) => !existingTags.has(t));

  await Promise.all([
    ...toDelete.map((t) => ctx.db.delete(t._id)),
    ...toInsert.map((t) => ctx.db.insert("promptTags", { promptId, tag: t })),
  ]);
}

/**
 * Deletes all promptTags for a prompt.
 * Limited to MAX_TAGS_PER_PROMPT to bound operations.
 */
export async function deletePromptTags(
  ctx: MutationCtx,
  promptId: Id<"prompts">
) {
  const tagDocs = await ctx.db
    .query("promptTags")
    .withIndex("by_promptId", (q) => q.eq("promptId", promptId))
    .take(MAX_TAGS_PER_PROMPT);

  await Promise.all(tagDocs.map((t) => ctx.db.delete(t._id)));
}

/**
 * Updates the userStats for a user with delta values.
 * Creates a new stats document if one doesn't exist.
 * @param ctx - Mutation context
 * @param userId - The user to update stats for
 * @param delta - The changes to apply (promptCount and/or downloads)
 */
export async function updateUserStats(
  ctx: MutationCtx,
  userId: string,
  delta: { promptCount?: number; downloads?: number }
) {
  const existing = await ctx.db
    .query("userStats")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      promptCount: existing.promptCount + (delta.promptCount ?? 0),
      totalDownloads: existing.totalDownloads + (delta.downloads ?? 0),
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("userStats", {
      userId,
      promptCount: Math.max(0, delta.promptCount ?? 0),
      totalDownloads: Math.max(0, delta.downloads ?? 0),
      updatedAt: Date.now(),
    });
  }
}

/**
 * Gets the userStats for a user, creating with zeros if it doesn't exist.
 * @param ctx - Mutation context
 * @param userId - The user to get stats for
 * @returns The user stats document
 */
export async function getUserStats(ctx: MutationCtx, userId: string) {
  const existing = await ctx.db
    .query("userStats")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (existing) {
    return existing;
  }

  const id = await ctx.db.insert("userStats", {
    userId,
    promptCount: 0,
    totalDownloads: 0,
    updatedAt: Date.now(),
  });

  return ctx.db.get(id);
}

/**
 * Updates the directory prompt count with delta value.
 * Note: totalDownloads is synced separately from skills.sh via cron.
 * @param ctx - Mutation context
 * @param directoryId - The directory to update stats for
 * @param delta - The changes to apply (promptCount only)
 */
export async function updateDirectoryStats(
  ctx: MutationCtx,
  directoryId: Id<"directories">,
  delta: { promptCount?: number }
) {
  const directory = await ctx.db.get(directoryId);
  if (!directory) {
    return;
  }

  await ctx.db.patch(directoryId, {
    promptCount: Math.max(
      0,
      (directory.promptCount ?? 0) + (delta.promptCount ?? 0)
    ),
  });
}
