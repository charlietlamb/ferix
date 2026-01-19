import { v } from "convex/values";
import slugify from "slugify";
import { internal } from "./_generated/api";
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
  extractTitle,
  fetchFileContent,
  fetchRepoInfo,
  fetchRepoTree,
  filterMarkdownFiles,
  parseGithubUrl,
} from "./lib/github";
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

export const list = query({
  handler: async (ctx) => {
    const directories = await ctx.db.query("directories").collect();
    return directories.map((dir) => ({
      ...dir,
      promptCount: dir.promptCount ?? 0,
      totalDownloads: dir.totalDownloads ?? 0,
    }));
  },
});

export const listTopByDownloads = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const directories = await ctx.db
      .query("directories")
      .withIndex("by_totalDownloads")
      .order("desc")
      .take(limit);

    return directories.map((dir) => ({
      ...dir,
      totalDownloads: dir.totalDownloads ?? 0,
      promptCount: dir.promptCount ?? 0,
    }));
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

    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId", (q) => q.eq("directoryId", args.directoryId))
      .collect();

    for (const prompt of prompts) {
      const commits = await ctx.db
        .query("commits")
        .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
        .collect();
      for (const commit of commits) {
        await ctx.db.delete(commit._id);
      }

      const saves = await ctx.db
        .query("saves")
        .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
        .collect();
      for (const save of saves) {
        await ctx.db.delete(save._id);
      }

      await ctx.db.delete(prompt._id);
    }

    await ctx.db.delete(args.directoryId);

    return { success: true, deletedPrompts: prompts.length };
  },
});

export const updateDirectoryCounts = internalMutation({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId", (q) => q.eq("directoryId", args.directoryId))
      .collect();

    const promptCount = prompts.length;
    const totalDownloads = prompts.reduce(
      (sum, p) => sum + (p.downloads ?? 0),
      0
    );

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
      .withIndex("by_directoryId", (q) => q.eq("directoryId", args.directoryId))
      .filter((q) => q.eq(q.field("filePath"), args.filePath))
      .first();

    if (existing) {
      const needsUpdate =
        existing.content !== args.content ||
        existing.title !== args.title ||
        JSON.stringify(existing.tags) !== JSON.stringify(args.tags);

      if (needsUpdate) {
        await ctx.db.patch(existing._id, {
          title: args.title,
          content: args.content,
          tags: args.tags,
          updatedAt: Date.now(),
        });
      }
    } else {
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
    }
  },
});

export const removeDeletedFiles = internalMutation({
  args: {
    directoryId: v.id("directories"),
    currentFilePaths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingPrompts = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId", (q) => q.eq("directoryId", args.directoryId))
      .collect();

    const currentPathsSet = new Set(args.currentFilePaths);

    for (const prompt of existingPrompts) {
      if (prompt.filePath && !currentPathsSet.has(prompt.filePath)) {
        const commits = await ctx.db
          .query("commits")
          .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
          .collect();
        for (const commit of commits) {
          await ctx.db.delete(commit._id);
        }

        const saves = await ctx.db
          .query("saves")
          .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
          .collect();
        for (const save of saves) {
          await ctx.db.delete(save._id);
        }

        await ctx.db.delete(prompt._id);
      }
    }
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
    const directories = await ctx.runQuery(internal.directories.listInternal);

    for (const directory of directories) {
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
  },
});

export const listInternal = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("directories").collect();
  },
});

export const validateGithubRepo = action({
  args: { owner: v.string(), repo: v.string() },
  handler: async (_ctx, args) => {
    return await fetchRepoInfo(args.owner, args.repo);
  },
});
