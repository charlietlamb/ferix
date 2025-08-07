import type { StreamId } from '@convex-dev/persistent-text-streaming';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internalQuery, mutation, query } from './_generated/server';
import { MessageRole } from './schema';
import { streamingComponent } from './streaming';

export const listMessages = query({
  args: {
    threadId: v.optional(v.id('threads')),
  },
  handler: async (ctx, args) => {
    if (!args.threadId) {
      return [];
    }
    return await ctx.db
      .query('messages')
      .withIndex('by_thread', (q) =>
        q.eq('threadId', args.threadId as Id<'threads'>)
      )
      .collect();
  },
});

export const clearMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query('messages').collect();
    await Promise.all(chats.map((chat) => ctx.db.delete(chat._id)));
  },
});

export const sendMessage = mutation({
  args: {
    text: v.string(),
    model: v.string(),
    threadId: v.optional(v.id('threads')),
    role: MessageRole,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Failed to send message: User Not Found');
    }
    const userId = identity.subject as Id<'users'>;
    if (!args.threadId) {
      const threadId = await ctx.db.insert('threads', {
        name: 'New Thread',
        createdByUserId: userId,
      });
      args.threadId = threadId;
    }

    const responseStreamId = await streamingComponent.createStream(ctx);
    const messageId = await ctx.db.insert('messages', {
      text: args.text,
      model: args.model,
      responseStreamId,
      threadId: args.threadId,
      role: args.role,
      sentByUserId: userId as Id<'users'>,
    });
    return { messageId, threadId: args.threadId };
  },
});

export const getHistory = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Grab all the user messages
    const allMessages = await ctx.db.query('messages').collect();

    // Lets join the user messages with the assistant messages
    const joinedResponses = await Promise.all(
      allMessages.map(async (userMessage) => {
        return {
          userMessage,
          responseMessage: await streamingComponent.getStreamBody(
            ctx,
            userMessage.responseStreamId as StreamId
          ),
        };
      })
    );

    return joinedResponses.flatMap((joined) => {
      const user = {
        id: joined.userMessage._id,
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: joined.userMessage.text }],
      };

      const assistant = {
        id: `${joined.userMessage._id}-assistant`,
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: joined.responseMessage.text }],
      };

      // If the assistant message is empty, its probably because we have not
      // started streaming yet so lets not include it in the history
      if (!assistant.parts[0].text) {
        return [user];
      }

      return [user, assistant];
    });
  },
});
