import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { enrichPrompts } from "./utils";

interface BetterAuthUser {
  _id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string;
  displayUsername?: string;
}

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalizedUsername = args.username.toLowerCase().trim();

    const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "username", value: normalizedUsername, operator: "eq" }],
    })) as BetterAuthUser | null;

    if (!user) {
      return null;
    }

    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const totalDownloads = prompts.reduce(
      (sum, p) => sum + (p.downloads ?? 0),
      0
    );

    return {
      _id: user._id,
      name: user.name,
      image: user.image ?? null,
      username: user.username,
      displayUsername: user.displayUsername ?? user.username,
      promptCount: prompts.length,
      totalDownloads,
    };
  },
});

export const listCreatedPrompts = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const allPrompts = await ctx.db
      .query("prompts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by downloads (most popular first)
    const sorted = allPrompts.sort(
      (a, b) => (b.downloads ?? 0) - (a.downloads ?? 0)
    );

    // Manual pagination
    const startIndex = args.paginationOpts.cursor
      ? sorted.findIndex(
          (p) => p._id === (args.paginationOpts.cursor as unknown)
        ) + 1
      : 0;
    const pageData = sorted.slice(
      startIndex,
      startIndex + args.paginationOpts.numItems
    );
    const hasMore = startIndex + args.paginationOpts.numItems < sorted.length;
    const nextCursor = hasMore ? pageData.at(-1)?._id : null;

    return {
      page: await enrichPrompts(ctx, pageData),
      isDone: !hasMore,
      continueCursor: (nextCursor ?? "") as string,
    };
  },
});

export const listSavedPrompts = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const saves = await ctx.db
      .query("saves")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
