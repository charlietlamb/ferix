import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import slugify from "slugify";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { promptTypes } from "./schema";
import { enrichPrompts } from "./utils";

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
      content: args.content,
      type: args.type,
      tags: args.tags ?? [],
      downloads: 0,
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
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return { page: [], isDone: true, continueCursor: "" as string };
    }

    const results = await ctx.db
      .query("prompts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await enrichPrompts(ctx, results.page),
    };
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

    return prompt;
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
      content: args.content,
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

export const getBySlug = query({
  args: {
    slug: v.string(),
    commitId: v.optional(v.id("commits")),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!prompt) {
      return null;
    }

    if (args.commitId) {
      const commit = await ctx.db.get(args.commitId);
      if (!commit || commit.promptId !== prompt._id) {
        return null;
      }
      return { ...prompt, content: commit.content, commitId: commit._id };
    }

    return { ...prompt, commitId: null };
  },
});

export const recordDownload = mutation({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      return;
    }
    await ctx.db.patch(args.promptId, {
      downloads: (prompt.downloads ?? 0) + 1,
    });
  },
});

export const listPopular = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("prompts")
      .withIndex("by_downloads")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await enrichPrompts(ctx, results.page),
    };
  },
});

export const listRecent = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("prompts")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: await enrichPrompts(ctx, results.page),
    };
  },
});

export const listByTag = query({
  args: {
    tag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const prompts = await ctx.db.query("prompts").order("desc").collect();

    const filtered = prompts.filter((prompt) => prompt.tags.includes(args.tag));

    const startIndex = args.paginationOpts.cursor
      ? filtered.findIndex(
          (p) => p._id === (args.paginationOpts.cursor as unknown)
        ) + 1
      : 0;

    const pageData = filtered.slice(
      startIndex,
      startIndex + args.paginationOpts.numItems
    );
    const hasMore = startIndex + args.paginationOpts.numItems < filtered.length;
    const nextCursor = hasMore ? pageData.at(-1)?._id : null;

    const enriched = await enrichPrompts(ctx, pageData);

    return {
      page: enriched,
      isDone: !hasMore,
      continueCursor: (nextCursor ?? "") as string,
    };
  },
});

export const toggleSave = mutation({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_user_prompt", (q) =>
        q.eq("userId", user._id).eq("promptId", args.promptId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("saves", {
      userId: user._id,
      promptId: args.promptId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const listSaved = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return { page: [], isDone: true, continueCursor: "" as string };
    }

    const saves = await ctx.db
      .query("saves")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const startIndex = args.paginationOpts.cursor
      ? saves.findIndex(
          (s) => s._id === (args.paginationOpts.cursor as unknown)
        ) + 1
      : 0;
    const pageData = saves.slice(
      startIndex,
      startIndex + args.paginationOpts.numItems
    );
    const hasMore = startIndex + args.paginationOpts.numItems < saves.length;
    const nextCursor = hasMore ? pageData.at(-1)?._id : null;

    const prompts = await Promise.all(
      pageData.map((save) => ctx.db.get(save.promptId))
    );
    const validPrompts = prompts.filter((p): p is Doc<"prompts"> => p !== null);

    const enriched = await enrichPrompts(ctx, validPrompts);

    return {
      page: enriched,
      isDone: !hasMore,
      continueCursor: (nextCursor ?? "") as string,
    };
  },
});
