import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

interface BetterAuthUser {
  _id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string;
  displayUsername?: string;
}

/**
 * Gets a user profile by username with their stats.
 * Uses denormalized userStats table for efficiency.
 */
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

    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return {
      _id: user._id,
      name: user.name,
      image: user.image ?? null,
      username: user.username,
      displayUsername: user.displayUsername ?? user.username,
      promptCount: stats?.promptCount ?? 0,
      totalDownloads: stats?.totalDownloads ?? 0,
    };
  },
});
