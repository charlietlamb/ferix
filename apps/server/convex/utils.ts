import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

export async function enrichWithCreator<T extends Doc<"prompts">>(
  ctx: QueryCtx,
  prompts: T[]
) {
  return await Promise.all(
    prompts.map(async (prompt) => {
      const user = await authComponent.getAnyUserById(ctx, prompt.userId);
      return {
        ...prompt,
        creator: user ? { name: user.name, image: user.image ?? null } : null,
      };
    })
  );
}
