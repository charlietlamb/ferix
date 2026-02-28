import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { fetchRepoInfo } from "./lib/github/repoInfo";
import { fetchServers, transformMcpServer } from "./lib/mcp";
import { mcpRegistryType, mcpTransportType } from "./schema";

const BATCH_SIZE = 500;

/**
 * Full sync - fetches all servers from MCP Registry with pagination.
 * Called weekly via cron job.
 */
export const syncAllServers = internalAction({
  handler: async (
    ctx
  ): Promise<
    { success: true; totalServers: number } | { success: false; error: string }
  > => {
    // Set sync status to syncing
    await ctx.runMutation(internal.mcpSync.updateSyncState, {
      syncStatus: "syncing",
    });

    try {
      let cursor: string | undefined;
      let totalProcessed = 0;
      const allServers: ReturnType<typeof transformMcpServer>[] = [];

      // Paginate through all servers
      do {
        const response = await fetchServers({ cursor, limit: 100 });

        for (const server of response.servers) {
          allServers.push(transformMcpServer(server));
        }

        cursor = response.metadata.nextCursor;
        totalProcessed += response.servers.length;
      } while (cursor);

      // Batch upsert servers
      for (let i = 0; i < allServers.length; i += BATCH_SIZE) {
        const batch = allServers.slice(i, i + BATCH_SIZE);
        await ctx.runMutation(internal.mcpSync.upsertServersBatch, {
          servers: batch,
        });
      }

      // Update sync state with completion
      await ctx.runMutation(internal.mcpSync.updateSyncState, {
        syncStatus: "idle",
        lastSyncAt: Date.now(),
        totalServers: totalProcessed,
      });

      return {
        success: true,
        totalServers: totalProcessed,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      await ctx.runMutation(internal.mcpSync.updateSyncState, {
        syncStatus: "error",
        errorMessage: message,
      });

      return { success: false, error: message };
    }
  },
});

/**
 * Incremental sync - only fetches recently updated servers.
 * Called every 6 hours via cron job.
 */
export const syncIncrementalServers = internalAction({
  handler: async (
    ctx
  ): Promise<
    | { success: true; updatedServers: number }
    | { success: false; error: string }
  > => {
    // Get last sync time
    const syncState = await ctx.runQuery(internal.mcpSync.getSyncState);
    const lastSyncAt = syncState?.lastSyncAt;

    // If no previous sync, do a full sync instead
    if (!lastSyncAt) {
      const result = await ctx.runAction(internal.mcpSync.syncAllServers);
      if (result.success) {
        return { success: true, updatedServers: result.totalServers };
      }
      return { success: false, error: result.error };
    }

    await ctx.runMutation(internal.mcpSync.updateSyncState, {
      syncStatus: "syncing",
    });

    try {
      const updatedSince = new Date(lastSyncAt).toISOString();
      let cursor: string | undefined;
      let totalUpdated = 0;
      const updatedServers: ReturnType<typeof transformMcpServer>[] = [];

      // Fetch only servers updated since last sync
      do {
        const response = await fetchServers({
          cursor,
          limit: 100,
          updatedSince,
        });

        for (const server of response.servers) {
          updatedServers.push(transformMcpServer(server));
        }

        cursor = response.metadata.nextCursor;
        totalUpdated += response.servers.length;
      } while (cursor);

      // Batch upsert updated servers
      for (let i = 0; i < updatedServers.length; i += BATCH_SIZE) {
        const batch = updatedServers.slice(i, i + BATCH_SIZE);
        await ctx.runMutation(internal.mcpSync.upsertServersBatch, {
          servers: batch,
        });
      }

      // Update sync state
      await ctx.runMutation(internal.mcpSync.updateSyncState, {
        syncStatus: "idle",
        lastSyncAt: Date.now(),
      });

      return {
        success: true,
        updatedServers: totalUpdated,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      await ctx.runMutation(internal.mcpSync.updateSyncState, {
        syncStatus: "error",
        errorMessage: message,
      });

      return { success: false, error: message };
    }
  },
});

/**
 * GitHub enrichment - fetches star counts for servers with GitHub repos.
 * Called daily via cron job.
 */
export const enrichWithGitHubStars = internalAction({
  handler: async (ctx) => {
    // Get servers that need GitHub enrichment (have repo but stale stars)
    const serversToEnrich = await ctx.runQuery(
      internal.mcpSync.getServersNeedingStars,
      { limit: 100 }
    );

    let enrichedCount = 0;
    const errors: string[] = [];

    for (const server of serversToEnrich) {
      if (!(server.githubOwner && server.githubRepo)) {
        continue;
      }

      try {
        const repoInfo = await fetchRepoInfo(
          server.githubOwner,
          server.githubRepo
        );

        await ctx.runMutation(internal.mcpSync.updateServerStars, {
          serverId: server._id,
          githubStars: repoInfo.stars,
        });

        enrichedCount++;
      } catch (error) {
        // Log but continue - some repos may be private or deleted
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`${server.name}: ${message}`);
      }
    }

    return {
      success: true,
      enrichedCount,
      errorsCount: errors.length,
    };
  },
});

/**
 * Batch upsert mutation for MCP servers.
 * Upserts by name - updates if exists, inserts if new.
 */
export const upsertServersBatch = internalMutation({
  args: {
    servers: v.array(
      v.object({
        name: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        version: v.string(),
        repositoryUrl: v.optional(v.string()),
        websiteUrl: v.optional(v.string()),
        iconUrl: v.optional(v.string()),
        packages: v.array(
          v.object({
            registryType: mcpRegistryType,
            identifier: v.string(),
            transport: mcpTransportType,
          })
        ),
        registryStatus: v.string(),
        publishedAt: v.number(),
        registryUpdatedAt: v.number(),
        githubOwner: v.optional(v.string()),
        githubRepo: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const server of args.servers) {
      const existing = await ctx.db
        .query("mcpServers")
        .withIndex("by_name", (q) => q.eq("name", server.name))
        .first();

      if (existing) {
        // Update existing server
        await ctx.db.patch(existing._id, {
          ...server,
          lastSyncedAt: now,
          // Preserve GitHub stars if we have them
          githubStars: existing.githubStars,
          githubStarsUpdatedAt: existing.githubStarsUpdatedAt,
        });
      } else {
        // Insert new server
        await ctx.db.insert("mcpServers", {
          ...server,
          lastSyncedAt: now,
        });
      }
    }
  },
});

/**
 * Gets servers that need GitHub star enrichment.
 * Returns servers with GitHub repos where stars are stale (>24h) or missing.
 */
export const getServersNeedingStars = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const staleThreshold = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    const servers = await ctx.db
      .query("mcpServers")
      .filter((q) =>
        q.and(
          q.neq(q.field("githubOwner"), undefined),
          q.neq(q.field("githubRepo"), undefined),
          q.or(
            q.eq(q.field("githubStarsUpdatedAt"), undefined),
            q.lt(q.field("githubStarsUpdatedAt"), staleThreshold)
          )
        )
      )
      .take(args.limit);

    return servers;
  },
});

/**
 * Updates GitHub stars for a single server.
 */
export const updateServerStars = internalMutation({
  args: {
    serverId: v.id("mcpServers"),
    githubStars: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.serverId, {
      githubStars: args.githubStars,
      githubStarsUpdatedAt: Date.now(),
    });
  },
});

/**
 * Gets current sync state.
 */
export const getSyncState = internalQuery({
  handler: (ctx) => {
    return ctx.db
      .query("mcpSyncState")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
  },
});

/**
 * Updates the global sync state.
 */
export const updateSyncState = internalMutation({
  args: {
    syncStatus: v.union(
      v.literal("idle"),
      v.literal("syncing"),
      v.literal("error")
    ),
    lastSyncAt: v.optional(v.number()),
    totalServers: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mcpSyncState")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    const updateData = {
      key: "global" as const,
      syncStatus: args.syncStatus,
      lastSyncAt: args.lastSyncAt ?? existing?.lastSyncAt,
      totalServers: args.totalServers ?? existing?.totalServers ?? 0,
      errorMessage: args.errorMessage,
    };

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("mcpSyncState", updateData);
    }
  },
});
