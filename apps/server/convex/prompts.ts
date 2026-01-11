import { v } from "convex/values";
import slugify from "slugify";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { promptTypes } from "./schema";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: promptTypes,
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const baseSlug = slugify(args.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (
      await ctx.db
        .query("prompts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const promptId = await ctx.db.insert("prompts", {
      userId: user._id,
      title: args.title,
      slug,
      type: args.type,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("commits", {
      promptId,
      content: args.content,
      createdAt: now,
    });

    return promptId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const promptsWithContent = await Promise.all(
      prompts.map(async (prompt) => {
        const latestCommit = await ctx.db
          .query("commits")
          .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
          .order("desc")
          .first();

        return {
          ...prompt,
          content: latestCommit?.content ?? "",
        };
      })
    );

    return promptsWithContent;
  },
});

export const get = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.userId !== user._id) {
      return null;
    }

    const latestCommit = await ctx.db
      .query("commits")
      .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
      .order("desc")
      .first();

    return {
      ...prompt,
      content: latestCommit?.content ?? "",
    };
  },
});

export const update = mutation({
  args: {
    promptId: v.id("prompts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.userId !== user._id) {
      throw new Error("Prompt not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.promptId, {
      updatedAt: now,
    });

    await ctx.db.insert("commits", {
      promptId: args.promptId,
      content: args.content,
      createdAt: now,
    });

    return args.promptId;
  },
});

export const rename = mutation({
  args: {
    promptId: v.id("prompts"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.userId !== user._id) {
      throw new Error("Prompt not found");
    }

    await ctx.db.patch(args.promptId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return args.promptId;
  },
});

export const remove = mutation({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.userId !== user._id) {
      throw new Error("Prompt not found");
    }

    const commits = await ctx.db
      .query("commits")
      .withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
      .collect();

    for (const commit of commits) {
      await ctx.db.delete(commit._id);
    }

    await ctx.db.delete(args.promptId);
  },
});
