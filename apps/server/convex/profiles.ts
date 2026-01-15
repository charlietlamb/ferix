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
    // Use compound index for efficient pagination sorted by downloads
    const results = await ctx.db
      .query("prompts")
      .withIndex("by_userId_downloads", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      page: await enrichPrompts(ctx, results.page),
      isDone: results.isDone,
      continueCursor: results.continueCursor,
    };
  },
});

export const listSavedPrompts = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Use proper Convex pagination instead of collect + manual slicing
    const savesPage = await ctx.db
      .query("saves")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
