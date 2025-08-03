import type { Id } from './_generated/dataModel';
import { mutation } from './_generated/server';

export const createThread = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Failed to create thread: User Not Found');
    }
    const createdByUserId = identity.subject as Id<'users'>;

    if (!createdByUserId) {
      throw new Error('Failed to create thread: User Not Found');
    }

    return await ctx.db.insert('threads', {
      name: 'New Thread',
      createdByUserId,
    });
  },
});
