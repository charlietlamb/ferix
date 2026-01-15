import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import slugify from "slugify";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { generateUniqueSlug, validateSlugUnique } from "./lib/slug";
import { promptTypes } from "./schema";
import { enrichPrompts } from "./utils";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: promptTypes,
    tags: v.optional(v.array(v.string())),
    directoryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const baseSlug = slugify(args.title, { lower: true, strict: true });
    const slug = await generateUniqueSlug(ctx, baseSlug);

    const promptId = await ctx.db.insert("prompts", {
      userId: user._id,
      title: args.title,
      slug,
      content: args.content,
      type: args.type,
      tags: args.tags ?? [],
      directoryId: args.directoryId,
      downloads: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("commits", {
      promptId,
      content: args.content,
      createdAt: now,
    });

    return { promptId, slug };
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
    slug: v.optional(v.string()),
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

    if (args.slug && args.slug !== prompt.slug) {
      await validateSlugUnique(ctx, args.slug, args.promptId);
    }

    await ctx.db.patch(args.promptId, {
      title: args.title,
      ...(args.slug && { slug: args.slug }),
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

    const currentUser = await authComponent.safeGetAuthUser(ctx);

    const creator = await authComponent.getAnyUserById(ctx, prompt.userId);

    const saves = await ctx.db
      .query("saves")
      .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
      .collect();

    let isSaved = false;
    if (currentUser) {
      isSaved = saves.some((s) => s.userId === currentUser._id);
    }

    const basePrompt = {
      ...prompt,
      creator: creator
        ? { name: creator.name, image: creator.image ?? null }
        : null,
      isCreator: currentUser ? currentUser._id === prompt.userId : false,
      isSaved,
      saveCount: saves.length,
    };

    if (args.commitId) {
      const commit = await ctx.db.get(args.commitId);
      if (!commit || commit.promptId !== prompt._id) {
        return null;
      }
      return { ...basePrompt, content: commit.content, commitId: commit._id };
    }

    return { ...basePrompt, commitId: null };
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

/**
 * Lists prompts filtered by a specific tag with pagination.
 *
 * @limitation Convex does not support "array contains" filtering in queries,
 * so we must collect all prompts and filter in JavaScript. This is the
 * recommended approach from Convex docs but doesn't scale well.
 *
 * @todo If this becomes a performance issue, create a `prompt_tags` junction
 * table with an index on `tag` to enable proper indexed queries.
 */
export const listByTag = query({
  args: {
    tag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const allPrompts = await ctx.db.query("prompts").collect();
    const filtered = allPrompts
      .filter((prompt) => prompt.tags.includes(args.tag))
      .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));

    // Manual pagination on filtered results
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

    return {
      page: await enrichPrompts(ctx, pageData),
      isDone: !hasMore,
      continueCursor: (nextCursor ?? "") as string,
    };
  },
});

export const updateTags = mutation({
  args: {
    promptId: v.id("prompts"),
    tags: v.array(v.string()),
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
      tags: args.tags,
      updatedAt: Date.now(),
    });

    return args.promptId;
  },
});

export const updateDirectory = mutation({
  args: {
    promptId: v.id("prompts"),
    directoryId: v.optional(v.string()),
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
      directoryId: args.directoryId,
      updatedAt: Date.now(),
    });

    return args.promptId;
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

    // Use proper Convex pagination instead of collect + manual slicing
    const savesPage = await ctx.db
      .query("saves")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const prompts = await Promise.all(
      savesPage.page.map((save) => ctx.db.get(save.promptId))
    );
    const validPrompts = prompts.filter((p): p is Doc<"prompts"> => p !== null);

    return {
      page: await enrichPrompts(ctx, validPrompts),
      isDone: savesPage.isDone,
      continueCursor: savesPage.continueCursor,
    };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const normalizedQuery = args.query.toLowerCase().trim();

    if (!normalizedQuery) {
      const popular = await ctx.db
        .query("prompts")
        .withIndex("by_downloads")
        .order("desc")
        .take(6);
      return enrichPrompts(ctx, popular);
    }

    const allPrompts = await ctx.db.query("prompts").order("desc").take(100);

    const filtered = allPrompts
      .filter((prompt) => {
        const matchesTitle = prompt.title
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesSlug = prompt.slug.toLowerCase().includes(normalizedQuery);
        return matchesTitle || matchesSlug;
      })
      .slice(0, 8);

    return enrichPrompts(ctx, filtered);
  },
});
