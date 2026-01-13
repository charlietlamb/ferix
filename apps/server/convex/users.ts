import { v } from "convex/values";
import slugify from "slugify";
import { components } from "./_generated/api";
import { type QueryCtx, query } from "./_generated/server";

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
