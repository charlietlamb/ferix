import { type PaginationOptions, paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import slugify from "slugify";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import {
  deletePromptTags,
  syncPromptTags,
  updateUserStats,
} from "./lib/denormalized";
import { emptyPage, orderByValidator, paginate } from "./lib/pagination";
import { generateUniqueSlug, validateSlugUnique } from "./lib/slug";
import { promptTypes } from "./schema";
import { enrichPrompts } from "./utils";

type AuthUser = NonNullable<
  Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>
>;

async function getEditablePrompt(
  ctx: QueryCtx | MutationCtx,
  promptId: Id<"prompts">
): Promise<{ user: AuthUser; prompt: Doc<"prompts"> } | null> {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) {
    return null;
  }

  const prompt = await ctx.db.get(promptId);
  if (!prompt) {
    return null;
  }

  const isAdmin = user.role === "admin";
  const isOwner = prompt.userId === user._id;
  if (!(isOwner || isAdmin)) {
    return null;
  }

  return { user, prompt };
}

async function handleSearch(ctx: QueryCtx, search: string, limit: number) {
  const normalizedQuery = search.trim();
  const maxResults = Math.min(limit, 20);

  if (!normalizedQuery) {
    const popular = await ctx.db
      .query("prompts")
      .withIndex("by_downloads")
      .order("desc")
      .take(maxResults);
    return paginate(
      { page: popular, isDone: true, continueCursor: "" },
      (page) => enrichPrompts(ctx, page)
    );
  }

  const searchResults = await ctx.db
    .query("prompts")
    .withSearchIndex("search_title", (q) => q.search("title", normalizedQuery))
    .take(maxResults * 2);

  if (searchResults.length > 0) {
    return paginate(
      {
        page: searchResults.slice(0, maxResults),
        isDone: true,
        continueCursor: "",
      },
      (page) => enrichPrompts(ctx, page)
    );
  }

  const slugMatches = await ctx.db
    .query("prompts")
    .withIndex("by_slug", (q) => q.gte("slug", normalizedQuery.toLowerCase()))
    .take(maxResults * 2);

  const filtered = slugMatches
    .filter((p) => p.slug.toLowerCase().includes(normalizedQuery.toLowerCase()))
    .slice(0, maxResults);

  return paginate(
    { page: filtered, isDone: true, continueCursor: "" },
    (page) => enrichPrompts(ctx, page)
  );
}

async function handleTagFilter(
  ctx: QueryCtx,
  tag: string,
  paginationOpts: PaginationOptions
) {
  const tagResults = await ctx.db
    .query("promptTags")
    .withIndex("by_tag_promptId", (q) => q.eq("tag", tag))
    .paginate(paginationOpts);

  if (tagResults.page.length === 0 && paginationOpts.cursor === null) {
    return emptyPage();
  }

  const prompts = await Promise.all(
    tagResults.page.map((t) => ctx.db.get(t.promptId))
  );
  const validPrompts = prompts.filter((p): p is Doc<"prompts"> => p !== null);

  return {
    page: await enrichPrompts(ctx, validPrompts),
    isDone: tagResults.isDone,
    continueCursor: tagResults.continueCursor,
  };
}

async function handleSavedFilter(
  ctx: QueryCtx,
  savedByUserId: string,
  paginationOpts: PaginationOptions
) {
  const savesPage = await ctx.db
    .query("saves")
    .withIndex("by_userId", (q) => q.eq("userId", savedByUserId))
    .order("desc")
    .paginate(paginationOpts);

  const prompts = await Promise.all(
    savesPage.page.map((save) => ctx.db.get(save.promptId))
  );
  const validPrompts = prompts.filter((p): p is Doc<"prompts"> => p !== null);

  return {
    page: await enrichPrompts(ctx, validPrompts),
    isDone: savesPage.isDone,
    continueCursor: savesPage.continueCursor,
  };
}

async function handleDirectoryFilter(
  ctx: QueryCtx,
  directoryId: Id<"directories">,
  paginationOpts: PaginationOptions
) {
  const results = await ctx.db
    .query("prompts")
    .withIndex("by_directoryId", (q) => q.eq("directoryId", directoryId))
    .paginate(paginationOpts);

  return paginate(results, (page) => enrichPrompts(ctx, page));
}

async function handleUserFilter(
  ctx: QueryCtx,
  userId: string,
  orderBy: "recent" | "popular" | undefined,
  paginationOpts: PaginationOptions
) {
  const usePopularIndex = orderBy === "popular";

  const results = usePopularIndex
    ? await ctx.db
        .query("prompts")
        .withIndex("by_userId_downloads", (q) => q.eq("userId", userId))
        .order("desc")
        .paginate(paginationOpts)
    : await ctx.db
        .query("prompts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .paginate(paginationOpts);

  return paginate(results, (page) => enrichPrompts(ctx, page));
}

async function handleDefaultList(
  ctx: QueryCtx,
  orderBy: "recent" | "popular" | undefined,
  paginationOpts: PaginationOptions
) {
  const usePopularIndex = orderBy === "popular";

  const results = usePopularIndex
    ? await ctx.db
        .query("prompts")
        .withIndex("by_downloads")
        .order("desc")
        .paginate(paginationOpts)
    : await ctx.db
        .query("prompts")
        .withIndex("by_createdAt")
        .order("desc")
        .paginate(paginationOpts);

  return paginate(results, (page) => enrichPrompts(ctx, page));
}

/**
 * Unified prompt listing endpoint with filters for tag, directory, user, saved, and search.
 * Supports orderBy for sorting (recent/popular) where applicable.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tag: v.optional(v.string()),
    directoryId: v.optional(v.id("directories")),
    userId: v.optional(v.string()),
    savedByUserId: v.optional(v.string()),
    orderBy: orderByValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search?.trim()) {
      return await handleSearch(ctx, args.search, args.paginationOpts.numItems);
    }

    if (args.tag) {
      return await handleTagFilter(ctx, args.tag, args.paginationOpts);
    }

    if (args.savedByUserId) {
      return await handleSavedFilter(
        ctx,
        args.savedByUserId,
        args.paginationOpts
      );
    }

    if (args.directoryId) {
      return await handleDirectoryFilter(
        ctx,
        args.directoryId,
        args.paginationOpts
      );
    }

    if (args.userId) {
      return await handleUserFilter(
        ctx,
        args.userId,
        args.orderBy,
        args.paginationOpts
      );
    }

    return await handleDefaultList(ctx, args.orderBy, args.paginationOpts);
  },
});

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
    const slug = await generateUniqueSlug(ctx, baseSlug);
    const tags = args.tags ?? [];

    const promptId = await ctx.db.insert("prompts", {
      userId: user._id,
      title: args.title,
      slug,
      content: args.content,
      type: args.type,
      tags,
      downloads: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("commits", {
      promptId,
      content: args.content,
      createdAt: now,
    });

    await syncPromptTags(ctx, promptId, tags);
    await updateUserStats(ctx, user._id, { promptCount: 1 });

    return { promptId, slug };
  },
});

export const get = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const result = await getEditablePrompt(ctx, args.promptId);
    return result?.prompt ?? null;
  },
});

export const update = mutation({
  args: {
    promptId: v.id("prompts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await getEditablePrompt(ctx, args.promptId);
    if (!result) {
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
    const result = await getEditablePrompt(ctx, args.promptId);
    if (!result) {
      throw new Error("Prompt not found");
    }

    if (args.slug && args.slug !== result.prompt.slug) {
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
    const result = await getEditablePrompt(ctx, args.promptId);
    if (!result) {
      throw new Error("Prompt not found");
    }

    const { prompt } = result;

    const [commits, saves] = await Promise.all([
      ctx.db
        .query("commits")
        .withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
        .take(100),
      ctx.db
        .query("saves")
        .withIndex("by_promptId", (q) => q.eq("promptId", args.promptId))
        .take(100),
    ]);

    await Promise.all([
      ...commits.map((c) => ctx.db.delete(c._id)),
      ...saves.map((s) => ctx.db.delete(s._id)),
    ]);

    await deletePromptTags(ctx, args.promptId);
    if (prompt.userId) {
      await updateUserStats(ctx, prompt.userId, {
        promptCount: -1,
        downloads: -(prompt.downloads ?? 0),
      });
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

    const creator = prompt.userId
      ? await authComponent.getAnyUserById(ctx, prompt.userId)
      : null;

    let directory: (Doc<"directories"> & { promptCount: number }) | null = null;
    if (prompt.directoryId) {
      const dir = await ctx.db.get(prompt.directoryId);
      if (dir) {
        directory = {
          ...dir,
          promptCount: dir.promptCount ?? 0,
        };
      }
    }

    let isSaved = false;
    if (currentUser) {
      const userSave = await ctx.db
        .query("saves")
        .withIndex("by_user_prompt", (q) =>
          q.eq("userId", currentUser._id).eq("promptId", prompt._id)
        )
        .first();
      isSaved = userSave !== null;
    }

    const saveCount = prompt.saveCount ?? 0;

    const basePrompt = {
      ...prompt,
      creator: creator
        ? {
            name: creator.name,
            image: creator.image ?? null,
            username: creator.username ?? null,
          }
        : null,
      directory: directory
        ? {
            _id: directory._id,
            owner: directory.owner,
            repo: directory.repo,
            name: directory.name,
            promptCount: directory.promptCount,
          }
        : null,
      isCreator: currentUser ? currentUser._id === prompt.userId : false,
      isSaved,
      saveCount,
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

/**
 * Records a download for a prompt. Intentionally public to allow anonymous
 * download tracking. Rate limiting should be handled at the HTTP/CDN layer.
 */
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

    if (prompt.userId) {
      await updateUserStats(ctx, prompt.userId, { downloads: 1 });
    }
  },
});

export const updateTags = mutation({
  args: {
    promptId: v.id("prompts"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getEditablePrompt(ctx, args.promptId);
    if (!result) {
      throw new Error("Prompt not found");
    }

    await ctx.db.patch(args.promptId, {
      tags: args.tags,
      updatedAt: Date.now(),
    });

    await syncPromptTags(ctx, args.promptId, args.tags);

    return args.promptId;
  },
});

export const updateType = mutation({
  args: {
    promptId: v.id("prompts"),
    type: promptTypes,
  },
  handler: async (ctx, args) => {
    const result = await getEditablePrompt(ctx, args.promptId);
    if (!result) {
      throw new Error("Prompt not found");
    }

    await ctx.db.patch(args.promptId, {
      type: args.type,
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

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      throw new Error("Prompt not found");
    }

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_user_prompt", (q) =>
        q.eq("userId", user._id).eq("promptId", args.promptId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.promptId, {
        saveCount: Math.max(0, (prompt.saveCount ?? 0) - 1),
      });
      return false;
    }

    await ctx.db.insert("saves", {
      userId: user._id,
      promptId: args.promptId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.promptId, {
      saveCount: (prompt.saveCount ?? 0) + 1,
    });
    return true;
  },
});
