import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { resolveFromNpm } from "./lib/npm";

// Cache TTL: 1 week in milliseconds
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Type for cache entries with freshness status
interface CacheEntry {
  packageName: string;
  githubOrg: string | null;
  repositoryUrl: string | null;
  isFresh: boolean;
}

/**
 * Internal query to get cached package org mappings.
 */
export const getBatch = internalQuery({
  args: { packageNames: v.array(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: Array<{
      packageName: string;
      githubOrg: string | null;
      repositoryUrl: string | null;
      isFresh: boolean;
    }> = [];

    for (const packageName of args.packageNames) {
      const cached = await ctx.db
        .query("packageOrgCache")
        .withIndex("by_packageName", (q) => q.eq("packageName", packageName))
        .first();

      if (cached) {
        const isFresh = now - cached.updatedAt < CACHE_TTL_MS;
        results.push({
          packageName: cached.packageName,
          githubOrg: cached.githubOrg,
          repositoryUrl: cached.repositoryUrl,
          isFresh,
        });
      }
    }

    return results;
  },
});

/**
 * Internal mutation to upsert a package org cache entry.
 */
export const upsert = internalMutation({
  args: {
    packageName: v.string(),
    githubOrg: v.union(v.string(), v.null()),
    repositoryUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("packageOrgCache")
      .withIndex("by_packageName", (q) => q.eq("packageName", args.packageName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        githubOrg: args.githubOrg,
        repositoryUrl: args.repositoryUrl,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("packageOrgCache", {
        packageName: args.packageName,
        githubOrg: args.githubOrg,
        repositoryUrl: args.repositoryUrl,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Public action to resolve npm package names to GitHub organizations.
 * Checks cache first, then queries npm registry for cache misses.
 */
export const resolve = action({
  args: { packageNames: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Step 1: Check cache for all packages
    const cached = await ctx.runQuery(internal.packageOrg.getBatch, {
      packageNames: args.packageNames,
    });

    const cachedMap = new Map<string, CacheEntry>(
      (cached as CacheEntry[])
        .filter((c) => c.isFresh)
        .map((c) => [c.packageName, c])
    );

    // Step 2: Identify cache misses
    const misses = args.packageNames.filter((name) => !cachedMap.has(name));

    // Step 3: Resolve cache misses from npm
    let resolved: Array<{
      packageName: string;
      githubOrg: string | null;
      repositoryUrl: string | null;
    }> = [];

    if (misses.length > 0) {
      resolved = await resolveFromNpm(misses);

      // Step 4: Update cache with new entries
      for (const entry of resolved) {
        await ctx.runMutation(internal.packageOrg.upsert, {
          packageName: entry.packageName,
          githubOrg: entry.githubOrg,
          repositoryUrl: entry.repositoryUrl,
        });
      }
    }

    // Step 5: Combine cached and newly resolved results
    const results: Array<{
      packageName: string;
      githubOrg: string | null;
    }> = [];

    for (const packageName of args.packageNames) {
      const cachedEntry = cachedMap.get(packageName);
      if (cachedEntry) {
        results.push({
          packageName: cachedEntry.packageName,
          githubOrg: cachedEntry.githubOrg,
        });
      } else {
        const resolvedEntry = resolved.find(
          (r) => r.packageName === packageName
        );
        results.push({
          packageName,
          githubOrg: resolvedEntry?.githubOrg ?? null,
        });
      }
    }

    return results;
  },
});
