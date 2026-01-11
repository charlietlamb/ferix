import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const promptTypes = v.union(v.literal("subagent"), v.literal("rule"));

export default defineSchema({
  prompts: defineTable({
    userId: v.string(),
    title: v.string(),
    slug: v.string(),
    type: promptTypes,
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_type", ["type"]),

  commits: defineTable({
    promptId: v.id("prompts"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_promptId", ["promptId"]),
});
