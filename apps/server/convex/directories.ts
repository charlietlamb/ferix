import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import slugify from "slugify";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";
import {
  deletePromptTags,
  syncPromptTags,
  updateDirectoryStats,
} from "./lib/denormalized";
import {
  extractTitle,
  fetchFileContent,
  fetchRepoInfo,
  fetchRepoTree,
  filterMarkdownFiles,
  parseGithubUrl,
} from "./lib/github";
import { orderByValidator, paginate } from "./lib/pagination";
import { generateUniqueSlug } from "./lib/slug";

export const create = mutation({
  args: {
    githubUrl: v.string(),
    tags: v.optional(v.array(v.string())),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user?._id) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("directories")
      .withIndex("by_githubUrl", (q) => q.eq("githubUrl", args.githubUrl))
      .first();

    if (existing) {
      throw new Error("Directory already exists");
    }

    const parsed = parseGithubUrl(args.githubUrl);
    if (!parsed) {
      throw new Error("Invalid GitHub URL");
    }

    const trimmedName = args.name?.trim();
    const name =
      trimmedName && trimmedName.length > 0
        ? trimmedName.slice(0, 32)
        : undefined;

    const directoryId = await ctx.db.insert("directories", {
      githubUrl: args.githubUrl,
      owner: parsed.owner,
      repo: parsed.repo,
      name,
      submittedByUserId: user._id,
      createdAt: Date.now(),
      tags: args.tags ?? [],
      promptCount: 0,
      totalDownloads: 0,
    });

    await ctx.scheduler.runAfter(0, internal.directories.syncDirectory, {
      directoryId,
    });

    return directoryId;
  },
});

/**
 * Unified directory listing endpoint with pagination, ordering, and search.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    orderBy: orderByValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const index =
      args.orderBy === "recent" ? "by_createdAt" : "by_totalDownloads";

    const results = await ctx.db
      .query("directories")
      .withIndex(index)
      .order("desc")
      .paginate(args.paginationOpts);

    let page = results.page;
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      page = page.filter(
        (d) =>
          d.owner.toLowerCase().includes(searchLower) ||
          d.repo.toLowerCase().includes(searchLower) ||
          d.name?.toLowerCase().includes(searchLower)
      );
    }

    return paginate({ ...results, page }, async (items) =>
      items.map((dir) => ({
        ...dir,
        promptCount: dir.promptCount ?? 0,
        totalDownloads: dir.totalDownloads ?? 0,
      }))
    );
  },
});

export const get = query({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.directoryId);
  },
});

export const getByGithubUrl = query({
  args: { githubUrl: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("directories")
      .withIndex("by_githubUrl", (q) => q.eq("githubUrl", args.githubUrl))
      .first();
  },
});

export const getByOwnerRepo = query({
  args: { owner: v.string(), repo: v.string() },
  handler: async (ctx, args) => {
    const githubUrl = `https://github.com/${args.owner}/${args.repo}`;
    return await ctx.db
      .query("directories")
      .withIndex("by_githubUrl", (q) => q.eq("githubUrl", githubUrl))
      .first();
  },
});

export const updateTags = mutation({
  args: {
    directoryId: v.id("directories"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Only admins can update directory tags");
    }

    const directory = await ctx.db.get(args.directoryId);
    if (!directory) {
      throw new Error("Directory not found");
    }

    await ctx.db.patch(args.directoryId, { tags: args.tags });

    await ctx.scheduler.runAfter(0, internal.directories.syncDirectory, {
      directoryId: args.directoryId,
    });

    return { success: true };
  },
});

export const updateName = mutation({
  args: {
    directoryId: v.id("directories"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Only admins can update directory name");
    }

    const directory = await ctx.db.get(args.directoryId);
    if (!directory) {
      throw new Error("Directory not found");
    }

    const trimmedName = args.name?.trim();
    const name =
      trimmedName && trimmedName.length > 0
        ? trimmedName.slice(0, 32)
        : undefined;

    await ctx.db.patch(args.directoryId, { name });

    return { success: true };
  },
});

export const remove = mutation({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const directory = await ctx.db.get(args.directoryId);
    if (!directory) {
      throw new Error("Directory not found");
    }

    const isAdmin = user.role === "admin";
    const isSubmitter = directory.submittedByUserId === user._id;

    if (!(isAdmin || isSubmitter)) {
      throw new Error("Unauthorized");
    }

    let deletedPrompts = 0;
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: {
        page: Array<{ _id: Id<"prompts"> }>;
        isDone: boolean;
        continueCursor: string;
      } = await ctx.db
        .query("prompts")
        .withIndex("by_directoryId", (q) =>
          q.eq("directoryId", args.directoryId)
        )
        .paginate({ numItems: 50, cursor });

      for (const prompt of result.page) {
        const [commits, saves] = await Promise.all([
          ctx.db
            .query("commits")
            .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
            .take(100),
          ctx.db
            .query("saves")
            .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
            .take(100),
        ]);

        await Promise.all([
          ...commits.map((c) => ctx.db.delete(c._id)),
          ...saves.map((s) => ctx.db.delete(s._id)),
        ]);

        await deletePromptTags(ctx, prompt._id);
        await ctx.db.delete(prompt._id);
        deletedPrompts++;
      }

      isDone = result.isDone;
      cursor = result.continueCursor;
    }

    await ctx.db.delete(args.directoryId);

    return { success: true, deletedPrompts };
  },
});

/**
 * Recalculates directory counts by paginating through prompts.
 * Used as a reconciliation step after sync operations.
 */
export const updateDirectoryCounts = internalMutation({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    let promptCount = 0;
    let totalDownloads = 0;
    let isDone = false;
    let cursor: string | null = null;

    while (!isDone) {
      const result: {
        page: Array<{ downloads?: number }>;
        isDone: boolean;
        continueCursor: string;
      } = await ctx.db
        .query("prompts")
        .withIndex("by_directoryId", (q) =>
          q.eq("directoryId", args.directoryId)
        )
        .paginate({ numItems: 100, cursor });

      promptCount += result.page.length;
      totalDownloads += result.page.reduce(
        (sum, p) => sum + (p.downloads ?? 0),
        0
      );

      isDone = result.isDone;
      cursor = result.continueCursor;
    }

    await ctx.db.patch(args.directoryId, { promptCount, totalDownloads });
  },
});

export const setSyncStatus = internalMutation({
  args: {
    directoryId: v.id("directories"),
    status: v.union(
      v.literal("syncing"),
      v.literal("success"),
      v.literal("error")
    ),
    lastSyncedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.directoryId, {
      syncStatus: args.status,
      ...(args.lastSyncedAt && { lastSyncedAt: args.lastSyncedAt }),
    });
  },
});

export const processGithubFile = internalMutation({
  args: {
    directoryId: v.id("directories"),
    filePath: v.string(),
    content: v.string(),
    title: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId_filePath", (q) =>
        q.eq("directoryId", args.directoryId).eq("filePath", args.filePath)
      )
      .first();

    if (existing) {
      const tagsChanged =
        JSON.stringify(existing.tags) !== JSON.stringify(args.tags);
      const needsUpdate =
        existing.content !== args.content ||
        existing.title !== args.title ||
        tagsChanged;

      if (needsUpdate) {
        await ctx.db.patch(existing._id, {
          title: args.title,
          content: args.content,
          tags: args.tags,
          updatedAt: Date.now(),
        });

        if (tagsChanged) {
          await syncPromptTags(ctx, existing._id, args.tags);
        }
      }
      return { created: false };
    }

    const baseSlug = slugify(args.title, { lower: true, strict: true });
    const slug = await generateUniqueSlug(ctx, baseSlug);
    const now = Date.now();

    const promptId = await ctx.db.insert("prompts", {
      title: args.title,
      slug,
      content: args.content,
      type: "skill",
      tags: args.tags,
      downloads: 0,
      createdAt: now,
      updatedAt: now,
      directoryId: args.directoryId,
      filePath: args.filePath,
    });

    await ctx.db.insert("commits", {
      promptId,
      content: args.content,
      createdAt: now,
    });

    await syncPromptTags(ctx, promptId, args.tags);
    await updateDirectoryStats(ctx, args.directoryId, { promptCount: 1 });

    return { created: true };
  },
});

export const removeDeletedFiles = internalMutation({
  args: {
    directoryId: v.id("directories"),
    currentFilePaths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentPathsSet = new Set(args.currentFilePaths);
    let deletedCount = 0;
    let deletedDownloads = 0;

    const existingPrompts = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId", (q) => q.eq("directoryId", args.directoryId))
      .take(500);

    for (const prompt of existingPrompts) {
      if (prompt.filePath && !currentPathsSet.has(prompt.filePath)) {
        const [commits, saves] = await Promise.all([
          ctx.db
            .query("commits")
            .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
            .take(100),
          ctx.db
            .query("saves")
            .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
            .take(100),
        ]);

        await Promise.all([
          ...commits.map((c) => ctx.db.delete(c._id)),
          ...saves.map((s) => ctx.db.delete(s._id)),
        ]);

        await deletePromptTags(ctx, prompt._id);
        await ctx.db.delete(prompt._id);

        deletedCount++;
        deletedDownloads += prompt.downloads ?? 0;
      }
    }

    if (deletedCount > 0) {
      await updateDirectoryStats(ctx, args.directoryId, {
        promptCount: -deletedCount,
        downloads: -deletedDownloads,
      });
    }

    return { deletedCount };
  },
});

export const syncDirectory = internalAction({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    const directory = await ctx.runQuery(internal.directories.getInternal, {
      directoryId: args.directoryId,
    });

    if (!directory) {
      throw new Error("Directory not found");
    }

    const { owner, repo, name, tags } = directory;
    const directoryTags = tags ?? [];

    await ctx.runMutation(internal.directories.setSyncStatus, {
      directoryId: args.directoryId,
      status: "syncing",
    });

    try {
      const tree = await fetchRepoTree(owner, repo);
      const markdownFiles = filterMarkdownFiles(tree);

      const filePaths: string[] = [];
      for (const file of markdownFiles) {
        filePaths.push(file.path);

        const content = await fetchFileContent(owner, repo, file.path);
        const title = extractTitle(file.path, owner, name);

        await ctx.runMutation(internal.directories.processGithubFile, {
          directoryId: args.directoryId,
          filePath: file.path,
          content,
          title,
          tags: directoryTags,
        });
      }

      await ctx.runMutation(internal.directories.removeDeletedFiles, {
        directoryId: args.directoryId,
        currentFilePaths: filePaths,
      });

      await ctx.runMutation(internal.directories.updateDirectoryCounts, {
        directoryId: args.directoryId,
      });

      await ctx.runMutation(internal.directories.setSyncStatus, {
        directoryId: args.directoryId,
        status: "success",
        lastSyncedAt: Date.now(),
      });
    } catch (error) {
      await ctx.runMutation(internal.directories.setSyncStatus, {
        directoryId: args.directoryId,
        status: "error",
      });
      throw error;
    }
  },
});

export const getInternal = internalQuery({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.directoryId);
  },
});

export const triggerSync = mutation({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Only admins can trigger sync");
    }

    const directory = await ctx.db.get(args.directoryId);
    if (!directory) {
      throw new Error("Directory not found");
    }

    if (directory.syncStatus === "syncing") {
      throw new Error("Sync already in progress");
    }

    await ctx.scheduler.runAfter(0, internal.directories.syncDirectory, {
      directoryId: args.directoryId,
    });

    return { success: true };
  },
});

export const syncAllDirectories = internalAction({
  handler: async (ctx) => {
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: {
        page: Array<{
          _id: Id<"directories">;
          syncStatus?: "syncing" | "success" | "error";
          owner: string;
          repo: string;
        }>;
        isDone: boolean;
        continueCursor: string;
      } = await ctx.runQuery(internal.directories.listInternal, {
        paginationOpts: { numItems: 50, cursor },
      });

      for (const directory of result.page) {
        if (
          directory.syncStatus === "syncing" ||
          !directory.owner ||
          !directory.repo
        ) {
          continue;
        }

        await ctx.runAction(internal.directories.syncDirectory, {
          directoryId: directory._id,
        });
      }

      isDone = result.isDone;
      cursor = result.continueCursor;
    }
  },
});

export const listInternal = internalQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("directories").paginate(args.paginationOpts);
  },
});

export const validateGithubRepo = action({
  args: { owner: v.string(), repo: v.string() },
  handler: async (_ctx, args) => {
    return await fetchRepoInfo(args.owner, args.repo);
  },
});

/**
 * Lists featured directories in admin-defined order, falling back to popular.
 * Returns exactly `limit` directories, filling with popular ones if needed.
 */
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12;

    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "featuredRepositories"))
      .first();

    const featuredIds: string[] = setting?.value ?? [];

    const featuredDirs: Array<{
      _id: Id<"directories">;
      githubUrl: string;
      owner: string;
      repo: string;
      name?: string;
      promptCount: number;
      totalDownloads: number;
    }> = [];

    for (const id of featuredIds) {
      if (featuredDirs.length >= limit) {
        break;
      }
      const dir = await ctx.db.get(id as Id<"directories">);
      if (dir) {
        featuredDirs.push({
          _id: dir._id,
          githubUrl: dir.githubUrl,
          owner: dir.owner,
          repo: dir.repo,
          name: dir.name,
          promptCount: dir.promptCount ?? 0,
          totalDownloads: dir.totalDownloads ?? 0,
        });
      }
    }

    if (featuredDirs.length >= limit) {
      return featuredDirs;
    }

    const featuredIdSet = new Set(featuredDirs.map((d) => d._id));
    const remaining = limit - featuredDirs.length;

    const popularDirs = await ctx.db
      .query("directories")
      .withIndex("by_totalDownloads")
      .order("desc")
      .take(remaining + featuredDirs.length);

    for (const dir of popularDirs) {
      if (featuredDirs.length >= limit) {
        break;
      }
      if (!featuredIdSet.has(dir._id)) {
        featuredDirs.push({
          _id: dir._id,
          githubUrl: dir.githubUrl,
          owner: dir.owner,
          repo: dir.repo,
          name: dir.name,
          promptCount: dir.promptCount ?? 0,
          totalDownloads: dir.totalDownloads ?? 0,
        });
      }
    }

    return featuredDirs;
  },
});
