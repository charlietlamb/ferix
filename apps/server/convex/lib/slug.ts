import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Generates a unique slug by appending a counter if the base slug already exists.
 * Optionally excludes a specific prompt ID (useful for updates).
 */
export async function generateUniqueSlug(
  ctx: MutationCtx,
  baseSlug: string,
  excludeId?: Id<"prompts">
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ctx.db
      .query("prompts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!existing || existing._id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Validates that a slug is unique, throwing an error if it already exists.
 * Excludes the specified prompt ID from the check.
 */
export async function validateSlugUnique(
  ctx: MutationCtx,
  slug: string,
  excludeId: Id<"prompts">
): Promise<void> {
  const existing = await ctx.db
    .query("prompts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();

  if (existing && existing._id !== excludeId) {
    throw new Error("Slug already exists");
  }
}
