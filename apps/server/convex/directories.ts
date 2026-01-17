import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const create = mutation({
  args: { githubUrl: v.string() },
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

    return await ctx.db.insert("directories", {
      githubUrl: args.githubUrl,
      submittedByUserId: user._id,
      createdAt: Date.now(),
    });
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

    await ctx.db.delete(args.directoryId);
  },
});
