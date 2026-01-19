import { v } from "convex/values";
import slugify from "slugify";
import { components } from "./_generated/api";
import { type QueryCtx, query } from "./_generated/server";
import { authComponent } from "./auth";

type RunQuery = QueryCtx["runQuery"];

export async function checkUsernameExists(
  runQuery: RunQuery,
  username: string
): Promise<boolean> {
  const normalizedUsername = username.toLowerCase().trim();
  const existingUser = await runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "username", value: normalizedUsername, operator: "eq" }],
  });
  return existingUser !== null;
}

export async function generateUniqueUsername(
  runQuery: RunQuery,
  name: string
): Promise<string> {
  const base = slugify(name, { lower: true, strict: true, replacement: "_" });

  if (!(await checkUsernameExists(runQuery, base))) {
    return base;
  }

  for (let i = 1; i < 100; i++) {
    const candidate = `${base}_${i}`;
    if (!(await checkUsernameExists(runQuery, candidate))) {
      return candidate;
    }
  }

  return `${base}_${Date.now()}`;
}

export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const exists = await checkUsernameExists(ctx.runQuery, args.username);
    return { available: !exists };
  },
});

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  username?: string | null;
  image?: string | null;
  role?: string | null;
}

/**
 * Lists users for admin impersonation feature.
 * Limited to 100 users without cursor pagination - this is intentional
 * as it's an admin-only feature and 100 users is sufficient for the use case.
 */
export const listForImpersonation = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user || user.role !== "admin") {
      return [];
    }

    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      limit: 100,
      paginationOpts: { cursor: null, numItems: 100 },
    });

    const users = (result?.page ?? []) as UserRecord[];
    if (users.length === 0) {
      return [];
    }

    const search = args.search?.toLowerCase().trim();
    const filtered = search
      ? users.filter(
          (user) =>
            user.name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.username?.toLowerCase()?.includes(search)
        )
      : users;

    return filtered.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username ?? null,
      image: user.image ?? null,
      role: user.role ?? null,
    }));
  },
});
