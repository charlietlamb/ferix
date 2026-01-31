import { Workpool } from "@convex-dev/workpool";
import { env } from "@ferix/env/convex";
import Firecrawl from "@mendable/firecrawl-js";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
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
  extractTitle,
  fetchFileContent,
  fetchRepoTreeWithRateLimit,
  filterMarkdownFiles,
} from "./lib/github";
import { parseGithubUrl, SKILLS_SH_URL_REGEX } from "./lib/regex";
import { bulkImportJobStatus } from "./schema";

// Workpool configuration: conservative parallelism for rate limit safety
const syncPool = new Workpool(components.directorySync, {
  maxParallelism: 2, // Only 2 concurrent syncs to stay well under rate limit
  retryActionsByDefault: true,
  defaultRetryBehavior: {
    maxAttempts: 5,
    initialBackoffMs: 10_000, // 10s initial delay
    base: 2, // 10s, 20s, 40s, 80s, 160s
  },
});

// ============================================================================
// Admin Mutations
// ============================================================================

/**
 * Creates a new bulk import job from an array of GitHub URLs.
 * Admin only.
 */
export const createJob = mutation({
  args: {
    githubUrls: v.array(v.string()),
    defaultTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Validate and deduplicate URLs
    const validUrls: string[] = [];
    const invalidUrls: string[] = [];
    const seen = new Set<string>();

    for (const url of args.githubUrls) {
      const trimmed = url.trim();
      if (seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);

      const parsed = parseGithubUrl(trimmed);
      if (parsed) {
        validUrls.push(trimmed);
      } else {
        invalidUrls.push(trimmed);
      }
    }

    if (validUrls.length === 0) {
      throw new Error(
        invalidUrls.length > 0
          ? `No valid GitHub URLs. Invalid: ${invalidUrls.slice(0, 5).join(", ")}${invalidUrls.length > 5 ? "..." : ""}`
          : "No URLs provided"
      );
    }

    const now = Date.now();

    // Create the job
    const jobId = await ctx.db.insert("bulkImportJobs", {
      status: "pending",
      totalCount: validUrls.length,
      completedCount: 0,
      failedCount: 0,
      createdByUserId: user._id,
      defaultTags: args.defaultTags,
      createdAt: now,
    });

    // Create individual items for each URL
    for (const githubUrl of validUrls) {
      await ctx.db.insert("bulkImportItems", {
        jobId,
        githubUrl,
        status: "pending",
      });
    }

    // Schedule the job to start processing
    await ctx.scheduler.runAfter(0, internal.bulkImport.startJob, { jobId });

    return {
      jobId,
      totalCount: validUrls.length,
      invalidUrls: invalidUrls.length > 0 ? invalidUrls : undefined,
    };
  },
});

/**
 * Pause an in-progress bulk import job.
 */
export const pauseJob = mutation({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.status !== "running" && job.status !== "pending") {
      throw new Error("Can only pause pending or running jobs");
    }

    await ctx.db.patch(args.jobId, { status: "paused" });
    return { success: true };
  },
});

/**
 * Resume a paused bulk import job.
 */
export const resumeJob = mutation({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.status !== "paused") {
      throw new Error("Can only resume paused jobs");
    }

    await ctx.db.patch(args.jobId, { status: "pending" });
    await ctx.scheduler.runAfter(0, internal.bulkImport.startJob, {
      jobId: args.jobId,
    });

    return { success: true };
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a bulk import job by ID with its items.
 */
export const getJob = query({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return null;
    }

    const items = await ctx.db
      .query("bulkImportItems")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .collect();

    return { ...job, items };
  },
});

/**
 * List all bulk import jobs.
 */
export const listJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db
      .query("bulkImportJobs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

/**
 * Get failed items for a job.
 */
export const getFailedItems = query({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db
      .query("bulkImportItems")
      .withIndex("by_jobId_status", (q) =>
        q.eq("jobId", args.jobId).eq("status", "failed")
      )
      .collect();
  },
});

// ============================================================================
// Internal Functions
// ============================================================================

export const getJobInternal = internalQuery({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getItemsByJob = internalQuery({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bulkImportItems")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .collect();
  },
});

export const updateJobStatus = internalMutation({
  args: {
    jobId: v.id("bulkImportJobs"),
    status: bulkImportJobStatus,
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { jobId, ...updates } = args;
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(jobId, cleanedUpdates);
  },
});

export const getOrCreateDirectory = internalMutation({
  args: {
    githubUrl: v.string(),
    defaultTags: v.array(v.string()),
    createdByUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate GitHub URL format first
    const parsed = parseGithubUrl(args.githubUrl);
    if (!parsed) {
      throw new Error(
        `Invalid GitHub URL: ${args.githubUrl}. Must match https://github.com/{owner}/{repo}`
      );
    }

    // Check if already exists
    const existing = await ctx.db
      .query("directories")
      .withIndex("by_githubUrl", (q) => q.eq("githubUrl", args.githubUrl))
      .first();

    if (existing) {
      return { directoryId: existing._id, alreadyExists: true };
    }

    const directoryId = await ctx.db.insert("directories", {
      githubUrl: args.githubUrl,
      owner: parsed.owner,
      repo: parsed.repo,
      submittedByUserId: args.createdByUserId,
      createdAt: Date.now(),
      tags: args.defaultTags,
      promptCount: 0,
      totalDownloads: 0,
    });

    return { directoryId, alreadyExists: false };
  },
});

/**
 * Start processing a bulk import job.
 * Enqueues all items to the workpool - workpool handles parallelism & retries.
 */
export const startJob = internalAction({
  args: { jobId: v.id("bulkImportJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.bulkImport.getJobInternal, {
      jobId: args.jobId,
    });

    if (!job || job.status !== "pending") {
      return;
    }

    const items = await ctx.runQuery(internal.bulkImport.getItemsByJob, {
      jobId: args.jobId,
    });

    await ctx.runMutation(internal.bulkImport.updateJobStatus, {
      jobId: args.jobId,
      status: "running",
      startedAt: Date.now(),
    });

    // Enqueue all items - workpool handles parallelism & retries
    for (const item of items) {
      await syncPool.enqueueAction(
        ctx,
        internal.bulkImport.syncSingleItem,
        {
          jobId: args.jobId,
          itemId: item._id,
          githubUrl: item.githubUrl,
          defaultTags: job.defaultTags ?? [],
          createdByUserId: job.createdByUserId,
        },
        {
          onComplete: internal.bulkImport.onItemComplete,
          context: { jobId: args.jobId, itemId: item._id },
        }
      );
    }
  },
});

/**
 * Sync a single item (called by workpool).
 * No intermediate status updates - workpool handles retries,
 * onComplete handles final status.
 */
export const syncSingleItem = internalAction({
  args: {
    jobId: v.id("bulkImportJobs"),
    itemId: v.id("bulkImportItems"),
    githubUrl: v.string(),
    defaultTags: v.array(v.string()),
    createdByUserId: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; directoryId: Id<"directories"> }> => {
    console.log(`[sync] Starting: ${args.githubUrl}`);

    // Get or create the directory
    const { directoryId, alreadyExists } = await ctx.runMutation(
      internal.bulkImport.getOrCreateDirectory,
      {
        githubUrl: args.githubUrl,
        defaultTags: args.defaultTags,
        createdByUserId: args.createdByUserId,
      }
    );

    // Skip GitHub API calls if directory already exists
    if (alreadyExists) {
      console.log(`[sync] Skipped (already exists): ${args.githubUrl}`);
      return { success: true, directoryId };
    }

    const parsed = parseGithubUrl(args.githubUrl);
    if (!parsed) {
      throw new Error("Invalid GitHub URL");
    }

    // Fetch repo tree
    const { tree } = await fetchRepoTreeWithRateLimit(
      parsed.owner,
      parsed.repo
    );

    // Get directory for name extraction
    const directory = await ctx.runQuery(internal.directories.getInternal, {
      directoryId,
    });

    // Filter and process markdown files
    const markdownFiles = filterMarkdownFiles(tree);
    console.log(
      `[sync] Found ${markdownFiles.length} files in ${args.githubUrl}`
    );

    for (const file of markdownFiles) {
      const content = await fetchFileContent(
        parsed.owner,
        parsed.repo,
        file.path
      );
      const title = extractTitle(file.path, parsed.owner, directory?.name);

      await ctx.runMutation(internal.directories.processGithubFile, {
        directoryId,
        filePath: file.path,
        content,
        title,
        tags: args.defaultTags,
      });
    }

    // Update directory counts
    await ctx.runMutation(internal.directories.updateDirectoryCounts, {
      directoryId,
    });

    // Mark directory sync as complete
    await ctx.runMutation(internal.directories.setSyncStatus, {
      directoryId,
      status: "success",
      lastSyncedAt: Date.now(),
    });

    console.log(`[sync] Completed: ${args.githubUrl}`);
    return { success: true, directoryId };
  },
});

/**
 * Called when an item completes (success or failure).
 * Updates item status and job counts atomically.
 */
export const onItemComplete = syncPool.defineOnComplete({
  context: v.object({
    jobId: v.id("bulkImportJobs"),
    itemId: v.id("bulkImportItems"),
  }),
  handler: async (ctx, { context, result }) => {
    const { jobId, itemId } = context;
    const job = await ctx.db.get(jobId);
    if (!job) {
      return;
    }

    // Cast to proper type - db.get returns generic in workpool context
    const currentCompletedCount = (job.completedCount as number) ?? 0;
    const currentFailedCount = (job.failedCount as number) ?? 0;
    const totalCount = (job.totalCount as number) ?? 0;

    // Update item status based on result
    if (result.kind === "success") {
      await ctx.db.patch(itemId, {
        status: "completed",
        directoryId: result.returnValue?.directoryId,
      });
      await ctx.db.patch(jobId, { completedCount: currentCompletedCount + 1 });
    } else {
      const error = result.kind === "failed" ? result.error : "Canceled";
      await ctx.db.patch(itemId, { status: "failed", error });
      await ctx.db.patch(jobId, { failedCount: currentFailedCount + 1 });
    }

    // Check if job is done
    const completed =
      currentCompletedCount + (result.kind === "success" ? 1 : 0);
    const failed = currentFailedCount + (result.kind !== "success" ? 1 : 0);

    if (completed + failed >= totalCount) {
      await ctx.db.patch(jobId, {
        status: failed > 0 && completed === 0 ? "failed" : "completed",
        completedAt: Date.now(),
      });
    }
  },
});

// ============================================================================
// Internal Job Creation (for use from actions)
// ============================================================================

/**
 * Internal mutation to create a bulk import job.
 * Called from actions that have already verified auth.
 */
export const createJobInternal = internalMutation({
  args: {
    githubUrls: v.array(v.string()),
    defaultTags: v.array(v.string()),
    createdByUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate and deduplicate URLs
    const validUrls: string[] = [];
    const invalidUrls: string[] = [];
    const seen = new Set<string>();

    for (const url of args.githubUrls) {
      const trimmed = url.trim();
      if (seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);

      const parsed = parseGithubUrl(trimmed);
      if (parsed) {
        validUrls.push(trimmed);
      } else {
        invalidUrls.push(trimmed);
      }
    }

    if (validUrls.length === 0) {
      throw new Error(
        invalidUrls.length > 0
          ? `No valid GitHub URLs. Invalid: ${invalidUrls.slice(0, 5).join(", ")}${invalidUrls.length > 5 ? "..." : ""}`
          : "No URLs provided"
      );
    }

    const now = Date.now();

    // Create the job
    const jobId = await ctx.db.insert("bulkImportJobs", {
      status: "pending",
      totalCount: validUrls.length,
      completedCount: 0,
      failedCount: 0,
      createdByUserId: args.createdByUserId,
      defaultTags: args.defaultTags.length > 0 ? args.defaultTags : undefined,
      createdAt: now,
    });

    // Create individual items for each URL
    for (const githubUrl of validUrls) {
      await ctx.db.insert("bulkImportItems", {
        jobId,
        githubUrl,
        status: "pending",
      });
    }

    // Schedule the job to start processing
    await ctx.scheduler.runAfter(0, internal.bulkImport.startJob, { jobId });

    return {
      jobId,
      totalCount: validUrls.length,
      invalidUrls: invalidUrls.length > 0 ? invalidUrls : undefined,
    };
  },
});

// ============================================================================
// Skills.sh Scraper
// ============================================================================

/**
 * Scrapes skills.sh using Firecrawl to find GitHub repositories.
 * Extracts owner/repo patterns and creates a bulk import job.
 * Admin only.
 */
export const scrapeSkillsSh = action({
  args: {
    defaultTags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth check (admin only)
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Initialize Firecrawl and scrape with scrolling
    // Firecrawl has a 5-minute (300s) max timeout. We optimize for maximum content:
    // - 150 scroll cycles × 800ms wait = ~120 seconds of scrolling
    // - Leaves ~180 seconds buffer for page rendering and content capture
    // - Reduced wait time (800ms) still allows lazy-loaded content to appear
    const firecrawl = new Firecrawl({
      apiKey: env.FIRECRAWL_API_KEY,
    });

    const scrollCount = 150; // Increased from 20 to capture more content
    const scrollWaitMs = 800; // Reduced from 1000ms for efficiency

    const scrollAction = [
      { type: "wait", milliseconds: scrollWaitMs },
      { type: "scroll", direction: "down" },
    ];
    const scrollActions = new Array(scrollCount).fill(scrollAction).flat();

    const result = await firecrawl.scrapeUrl("https://skills.sh", {
      formats: ["markdown"],
      timeout: 300_000, // 5 minutes - Firecrawl maximum
      actions: [
        { type: "wait", milliseconds: 2000 }, // Initial wait for page load
        { type: "scroll", direction: "down" },
        ...scrollActions,
      ],
    });

    // const result = mockFirecrawlResponse;

    console.log("Result:", result);
    // console.log(JSON.stringify(result, null, 2));

    if (!("markdown" in result)) {
      throw new Error("Failed to scrape skills.sh: no markdown content");
    }

    // Match skills.sh URLs and extract org/repo
    const matches = [...(result.markdown ?? "").matchAll(SKILLS_SH_URL_REGEX)];

    // Transform to GitHub URLs and deduplicate
    const githubUrls = [
      ...new Set(matches.map((m) => `https://github.com/${m[1]}/${m[2]}`)),
    ];

    // Log any URLs that don't pass parseGithubUrl validation
    for (const url of githubUrls) {
      if (!parseGithubUrl(url)) {
        console.log(`[scrapeSkillsSh] Skipped invalid URL: ${url}`);
      }
    }

    if (githubUrls.length === 0) {
      throw new Error("No GitHub repositories found on skills.sh");
    }

    // Apply limit if specified
    const limitedUrls = args.limit
      ? githubUrls.slice(0, args.limit)
      : githubUrls;

    console.log(
      `[scrapeSkillsSh] Found ${githubUrls.length} repos, importing ${limitedUrls.length}`
    );
    for (const url of limitedUrls) {
      console.log(`[scrapeSkillsSh] Queued: ${url}`);
    }

    // Create bulk import job
    const jobResult: {
      jobId: Id<"bulkImportJobs">;
      totalCount: number;
      invalidUrls: string[] | undefined;
    } = await ctx.runMutation(internal.bulkImport.createJobInternal, {
      githubUrls: limitedUrls,
      defaultTags: args.defaultTags ?? [],
      createdByUserId: user._id,
    });

    return {
      ...jobResult,
      scrapedUrls: githubUrls.length,
      limitedTo: args.limit,
    };
  },
});
