import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const promptTypes = v.union(
  v.literal("rules"),
  v.literal("subagent"),
  v.literal("system"),
  v.literal("skill")
);

export const syncStatusTypes = v.union(
  v.literal("syncing"),
  v.literal("success"),
  v.literal("error")
);

export default defineSchema({
  /**
   * Cache for npm package name to GitHub organization mapping.
   * Used by the sync feature to avoid repeated npm registry lookups.
   */
  packageOrgCache: defineTable({
    packageName: v.string(),
    githubOrg: v.union(v.string(), v.null()),
    repositoryUrl: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  })
    .index("by_packageName", ["packageName"])
    .index("by_updatedAt", ["updatedAt"]),

  stats: defineTable({
    key: v.string(),
    totalPrompts: v.number(),
    totalDownloads: v.number(),
    totalCreators: v.number(),
    tagCounts: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  prompts: defineTable({
    userId: v.optional(v.string()),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    type: promptTypes,
    tags: v.array(v.string()),
    downloads: v.number(),
    saveCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    directoryId: v.optional(v.id("directories")),
    filePath: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_type", ["type"])
    .index("by_downloads", ["downloads"])
    .index("by_userId_downloads", ["userId", "downloads"])
    .index("by_directoryId", ["directoryId"])
    .index("by_directoryId_filePath", ["directoryId", "filePath"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["type"],
    }),

  /** Junction table for efficient tag-based queries. */
  promptTags: defineTable({
    promptId: v.id("prompts"),
    tag: v.string(),
  })
    .index("by_promptId", ["promptId"])
    .index("by_tag_promptId", ["tag", "promptId"]),

  directories: defineTable({
    githubUrl: v.string(),
    owner: v.string(),
    repo: v.string(),
    name: v.optional(v.string()),
    submittedByUserId: v.string(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    lastSyncedAt: v.optional(v.number()),
    syncStatus: v.optional(syncStatusTypes),
    promptCount: v.optional(v.number()),
    totalDownloads: v.optional(v.number()),
  })
    .index("by_githubUrl", ["githubUrl"])
    .index("by_owner", ["owner"])
    .index("by_totalDownloads", ["totalDownloads"])
    .index("by_createdAt", ["createdAt"]),

  commits: defineTable({
    promptId: v.id("prompts"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_promptId", ["promptId"]),

  saves: defineTable({
    userId: v.string(),
    promptId: v.id("prompts"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_promptId", ["promptId"])
    .index("by_user_prompt", ["userId", "promptId"]),

  /** Denormalized user stats for efficient profile queries. */
  userStats: defineTable({
    userId: v.string(),
    promptCount: v.number(),
    totalDownloads: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  /** Key-value settings store for admin-configurable options. */
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
