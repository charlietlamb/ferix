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
    .index("by_directoryId", ["directoryId"]),

  directories: defineTable({
    githubUrl: v.string(),
    owner: v.string(),
    repo: v.string(),
    submittedByUserId: v.string(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    lastSyncedAt: v.optional(v.number()),
    syncStatus: v.optional(syncStatusTypes),
    promptCount: v.optional(v.number()),
    totalDownloads: v.optional(v.number()),
  })
    .index("by_githubUrl", ["githubUrl"])
    .index("by_totalDownloads", ["totalDownloads"]),

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
});
