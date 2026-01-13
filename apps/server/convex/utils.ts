import type { Doc } from "./_generated/dataModel";
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

  return Promise.all(
    prompts.map(async (prompt) => {
      const creator = await authComponent.getAnyUserById(ctx, prompt.userId);
      return {
        ...prompt,
        creator: creator
          ? { name: creator.name, image: creator.image ?? null }
          : null,
        isSaved: savedPromptIds.has(prompt._id.toString()),
      };
    })
  );
}
