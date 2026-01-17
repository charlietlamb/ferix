import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

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
    const userSaves = await ctx.db
      .query("saves")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .collect();
    savedPromptIds = new Set(userSaves.map((s) => s.promptId.toString()));
  }

  // Batch fetch all unique creators instead of N+1 individual fetches
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

  // Batch fetch all unique directories
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

  // Map prompts synchronously using pre-fetched data
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
