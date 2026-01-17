import { v } from "convex/values";
import slugify from "slugify";
import { internal } from "./_generated/api";
import {
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
  fetchRepoTree,
  filterMarkdownFiles,
  parseGithubUrl,
} from "./lib/github";
import { generateUniqueSlug } from "./lib/slug";

export const create = mutation({
  args: {
    githubUrl: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("directories")
      .withIndex("by_githubUrl", (q) => q.eq("githubUrl", args.githubUrl))
      .first();

    if (existing) {
      throw new Error("Directory already exists");
    }

    // Parse owner and repo from URL
    const parsed = parseGithubUrl(args.githubUrl);
    if (!parsed) {
      throw new Error("Invalid GitHub URL");
    }

    const directoryId = await ctx.db.insert("directories", {
      githubUrl: args.githubUrl,
      owner: parsed.owner,
      repo: parsed.repo,
      submittedByUserId: user._id,
      createdAt: Date.now(),
      tags: args.tags ?? [],
    });

    // Schedule initial sync
    await ctx.scheduler.runAfter(0, internal.directories.syncDirectory, {
      directoryId,
    });

    return directoryId;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("directories").collect();
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

/**
 * Update directory tags (admin only)
 * After updating, triggers a sync to propagate tags to all prompts
 */
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

    await ctx.db.patch(args.directoryId, {
      tags: args.tags,
    });

    // Schedule a sync to propagate tags to all prompts in this directory
    await ctx.scheduler.runAfter(0, internal.directories.syncDirectory, {
      directoryId: args.directoryId,
    });

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

    // Also delete all prompts associated with this directory
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_directoryId", (q) => q.eq("directoryId", args.directoryId))
      .collect();

    for (const prompt of prompts) {
      // Delete associated commits first
      const commits = await ctx.db
        .query("commits")
        .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
        .collect();
      for (const commit of commits) {
        await ctx.db.delete(commit._id);
      }
      // Delete associated saves
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

/**
 * Internal mutation to set sync status
 */
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

/**
 * Internal mutation to process a single file from GitHub sync
 */
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
      // Update existing prompt if content or title changed, always sync tags
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
      // Create new prompt
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

      // Create initial commit
      await ctx.db.insert("commits", {
        promptId,
        content: args.content,
        createdAt: now,
      });
    }
  },
});

/**
 * Internal mutation to remove prompts for deleted files
 */
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
        // Delete associated commits
        const commits = await ctx.db
          .query("commits")
          .withIndex("by_promptId", (q) => q.eq("promptId", prompt._id))
          .collect();
        for (const commit of commits) {
          await ctx.db.delete(commit._id);
        }
        // Delete associated saves
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

/**
 * Internal action to sync a directory's contents from GitHub.
 * Actions can make HTTP requests, then call mutations to write data.
 */
export const syncDirectory = internalAction({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    // Get directory info
    const directory = await ctx.runQuery(internal.directories.getInternal, {
      directoryId: args.directoryId,
    });

    if (!directory) {
      throw new Error("Directory not found");
    }

    const { owner, repo, tags } = directory;
    const directoryTags = tags ?? [];

    // Set status to syncing
    await ctx.runMutation(internal.directories.setSyncStatus, {
      directoryId: args.directoryId,
      status: "syncing",
    });

    try {
      // Fetch all files from the repo (this is allowed in actions!)
      const tree = await fetchRepoTree(owner, repo);
      const markdownFiles = filterMarkdownFiles(tree);

      // Process each markdown file
      const filePaths: string[] = [];
      for (const file of markdownFiles) {
        filePaths.push(file.path);

        // Fetch file content
        const content = await fetchFileContent(owner, repo, file.path);

        // Extract title from file path (use owner/org name as prefix)
        const title = extractTitle(file.path, owner);

        // Call mutation to process/save the file with directory tags
        await ctx.runMutation(internal.directories.processGithubFile, {
          directoryId: args.directoryId,
          filePath: file.path,
          content,
          title,
          tags: directoryTags,
        });
      }

      // Remove prompts for files that no longer exist
      await ctx.runMutation(internal.directories.removeDeletedFiles, {
        directoryId: args.directoryId,
        currentFilePaths: filePaths,
      });

      // Update status to success
      await ctx.runMutation(internal.directories.setSyncStatus, {
        directoryId: args.directoryId,
        status: "success",
        lastSyncedAt: Date.now(),
      });
    } catch (error) {
      // Update status to error
      await ctx.runMutation(internal.directories.setSyncStatus, {
        directoryId: args.directoryId,
        status: "error",
      });
      throw error;
    }
  },
});

/**
 * Internal query to get directory (for use in actions)
 */
export const getInternal = internalQuery({
  args: { directoryId: v.id("directories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.directoryId);
  },
});

/**
 * Mutation to manually trigger a sync (admin only)
 */
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

    // Don't allow triggering if already syncing
    if (directory.syncStatus === "syncing") {
      throw new Error("Sync already in progress");
    }

    // Schedule sync
    await ctx.scheduler.runAfter(0, internal.directories.syncDirectory, {
      directoryId: args.directoryId,
    });

    return { success: true };
  },
});

/**
 * Internal action to sync all directories (called by cron)
 */
export const syncAllDirectories = internalAction({
  handler: async (ctx) => {
    const directories = await ctx.runQuery(internal.directories.listInternal);

    for (const directory of directories) {
      // Skip if already syncing or missing owner/repo
      if (
        directory.syncStatus === "syncing" ||
        !directory.owner ||
        !directory.repo
      ) {
        continue;
      }

      // Run sync for each directory
      await ctx.runAction(internal.directories.syncDirectory, {
        directoryId: directory._id,
      });
    }
  },
});

/**
 * Internal query to list all directories (for use in actions)
 */
export const listInternal = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("directories").collect();
  },
});
