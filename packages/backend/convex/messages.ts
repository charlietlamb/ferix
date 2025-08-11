import {
  listMessages,
  saveMessage,
  syncStreams,
  vStreamArgs,
} from '@convex-dev/agent';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { components, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { baseAgent } from './agents/base';

export const sendMessage = mutation({
  args: { threadId: v.optional(v.id('threads')), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject as Id<'users'>;
    let resolvedThreadId: string;
    if (threadId) {
      resolvedThreadId = threadId;
    } else {
      const response = await baseAgent.createThread(ctx, {
        userId,
      });
      resolvedThreadId = response.threadId;
    }
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: resolvedThreadId,
      userId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.messages.generateResponseAsync, {
      threadId,
      promptMessageId: messageId,
    });

    return {
      threadId: resolvedThreadId,
      messageId,
    };
  },
});

export const generateResponseAsync = baseAgent.asTextAction();

export const listThreadMessages = query({
  args: {
    threadId: v.id('threads'),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    // await authorizeThreadAccess(ctx, threadId);

    const paginated = await listMessages(ctx, components.agent, {
      threadId,
      paginationOpts,
    });
    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

    // Here you could filter out / modify the documents & stream deltas.
    return { ...paginated, streams };
  },
});
