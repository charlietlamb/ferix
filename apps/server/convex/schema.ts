import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const promptTypes = v.union(v.literal("subagent"), v.literal("rule"));

export default defineSchema({
  prompts: defineTable({
    userId: v.string(),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    type: promptTypes,
    tags: v.array(v.string()),
    downloads: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_type", ["type"])
    .index("by_downloads", ["downloads"]),

  commits: defineTable({
    promptId: v.id("prompts"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_promptId", ["promptId"]),
});
