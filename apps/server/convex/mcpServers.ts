import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { paginate } from "./lib/pagination";

const sortByValidator = v.union(
  v.literal("stars"),
  v.literal("recent"),
  v.literal("name")
);

/**
 * Lists MCP servers with pagination, search, and sorting.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(sortByValidator),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "stars";

    // Use search index for text search
    if (args.search?.trim()) {
      const results = await ctx.db
        .query("mcpServers")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.search ?? "")
        )
        .paginate(args.paginationOpts);

      return paginate(results, async (items) => items);
    }

    // Otherwise use regular index based on sort
    let index: "by_githubStars" | "by_registryUpdatedAt" | "by_name";
    if (sortBy === "stars") {
      index = "by_githubStars";
    } else if (sortBy === "recent") {
      index = "by_registryUpdatedAt";
    } else {
      index = "by_name";
    }

    const results = await ctx.db
      .query("mcpServers")
      .withIndex(index)
      .order("desc")
      .paginate(args.paginationOpts);

    return paginate(results, async (items) => items);
  },
});

/**
 * Gets a single MCP server by name.
 */
export const getByName = query({
  args: { name: v.string() },
  handler: (ctx, args) => {
    return ctx.db
      .query("mcpServers")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

/**
 * Gets popular MCP servers sorted by GitHub stars.
 * Used for homepage widget.
 */
export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => {
    const limit = args.limit ?? 10;

    return ctx.db
      .query("mcpServers")
      .withIndex("by_githubStars")
      .order("desc")
      .take(limit);
  },
});

/**
 * Gets recently updated MCP servers.
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => {
    const limit = args.limit ?? 10;

    return ctx.db
      .query("mcpServers")
      .withIndex("by_registryUpdatedAt")
      .order("desc")
      .take(limit);
  },
});

/**
 * Gets the current sync state for display in admin/UI.
 */
export const getSyncState = query({
  handler: (ctx) => {
    return ctx.db
      .query("mcpSyncState")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
  },
});

/**
 * Gets total count of MCP servers.
 */
export const getCount = query({
  handler: async (ctx) => {
    const state = await ctx.db
      .query("mcpSyncState")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    return state?.totalServers ?? 0;
  },
});

/**
 * Admin mutation to trigger a manual sync.
 */
export const triggerSync = mutation({
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Only admins can trigger MCP sync");
    }

    const syncState = await ctx.db
      .query("mcpSyncState")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (syncState?.syncStatus === "syncing") {
      throw new Error("Sync already in progress");
    }

    await ctx.scheduler.runAfter(0, internal.mcpSync.syncAllServers);

    return { success: true };
  },
});
