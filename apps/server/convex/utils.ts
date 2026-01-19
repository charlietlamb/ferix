import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Enriches prompts with creator info, directory info, and save status.
 *
 * Uses per-prompt indexed lookups instead of collecting all user saves,
 * which is more efficient for typical page sizes (10-20 prompts).
 *
 * @param ctx - Query context
 * @param prompts - Array of prompts to enrich
 * @returns Enriched prompts with creator, directory, and isSaved fields
 */
export async function enrichPrompts<T extends Doc<"prompts">>(
  ctx: QueryCtx,
  prompts: T[]
) {
  if (prompts.length === 0) {
    return [];
  }

  const currentUser = await authComponent.safeGetAuthUser(ctx);

  let savedPromptIds = new Set<string>();
  if (currentUser) {
    const saveChecks = await Promise.all(
      prompts.map((p) =>
        ctx.db
          .query("saves")
          .withIndex("by_user_prompt", (q) =>
            q.eq("userId", currentUser._id).eq("promptId", p._id)
          )
          .first()
      )
    );
    savedPromptIds = new Set(
      saveChecks
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map((s) => s.promptId.toString())
    );
  }

  const uniqueUserIds = [
    ...new Set(prompts.map((p) => p.userId).filter((id): id is string => !!id)),
  ];
  const users = await Promise.all(
    uniqueUserIds.map((id) => authComponent.getAnyUserById(ctx, id))
  );
  const userMap = new Map<string, NonNullable<(typeof users)[number]>>(
    users
      .filter((u): u is NonNullable<typeof u> => u !== null)
      .map((u) => [u._id, u])
  );

  const uniqueDirectoryIds = [
    ...new Set(
      prompts
        .map((p) => p.directoryId)
        .filter((id): id is Id<"directories"> => !!id)
    ),
  ];
  const directories = await Promise.all(
    uniqueDirectoryIds.map((id) => ctx.db.get(id))
  );
  const directoryMap = new Map(
    directories
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map((d) => [d._id.toString(), d])
  );

  return prompts.map((prompt) => {
    const creator = prompt.userId ? userMap.get(prompt.userId) : undefined;
    const directory = prompt.directoryId
      ? directoryMap.get(prompt.directoryId.toString())
      : undefined;

    return {
      ...prompt,
      creator: creator
        ? {
            name: creator.name,
            image: creator.image ?? null,
            username: creator.username ?? null,
          }
        : null,
      directory: directory
        ? {
            _id: directory._id,
            owner: directory.owner,
            repo: directory.repo,
          }
        : null,
      isSaved: savedPromptIds.has(prompt._id.toString()),
    };
  });
}
