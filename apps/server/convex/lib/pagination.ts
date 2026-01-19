import type { PaginationResult } from "convex/server";
import { v } from "convex/values";

export const orderByValidator = v.optional(
  v.union(v.literal("recent"), v.literal("popular"))
);

/**
 * Creates a paginated response with optional enrichment function.
 * Returns PaginationResult for compatibility with usePaginatedQuery.
 */
export async function paginate<T, E = T>(
  results: PaginationResult<T>,
  enrichFn?: (items: T[]) => Promise<E[]>
): Promise<PaginationResult<E>> {
  const page = enrichFn
    ? await enrichFn(results.page)
    : (results.page as unknown as E[]);
  return {
    page,
    isDone: results.isDone,
    continueCursor: results.continueCursor,
  };
}

/**
 * Returns an empty paginated response.
 */
export function emptyPage<T>(): PaginationResult<T> {
  return { page: [], isDone: true, continueCursor: "" };
}
