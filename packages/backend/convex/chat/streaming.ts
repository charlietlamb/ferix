import { vStreamArgs } from '@convex-dev/agent';
import { internal } from '@ferix/backend/convex/_generated/api';
import {
  internalAction,
  mutation,
  query,
} from '@ferix/backend/convex/_generated/server';
import { baseAgent } from '@ferix/backend/convex/agents/base';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    //await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await baseAgent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated
      // lazily when streaming text.
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.chat.streaming.streamAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const { thread } = await baseAgent.continueThread(ctx, { threadId });
    const result = await thread.streamText(
      { promptMessageId },
      // more custom delta options (`true` uses defaults)
      { saveStreamDeltas: true }
    );
    // We need to make sure the stream finishes - by awaiting each chunk
    // or using this call to consume it all.
    await result.consumeStream();
  },
});

/**
 * Query & subscribe to messages & threads
 */

export const listMessages = query({
  args: {
    // These arguments are required:
    threadId: v.string(),
    paginationOpts: paginationOptsValidator, // Used to paginate the messages.
    streamArgs: vStreamArgs, // Used to stream messages.
  },
  handler: async (ctx, args) => {
    const { threadId, paginationOpts, streamArgs } = args;
    //await authorizeThreadAccess(ctx, threadId);
    const streams = await baseAgent.syncStreams(ctx, {
      threadId,
      streamArgs,
      includeStatuses: ['aborted', 'streaming'],
    });
    // Here you could filter out / modify the stream of deltas / filter out
    // deltas.

    const paginated = await baseAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });

    // Here you could filter out metadata that you don't want from any optional
    // fields on the messages.
    // You can also join data onto the messages. They need only extend the
    // MessageDoc type.
    // { ...messages, page: messages.page.map(...)}

    return {
      ...paginated,
      streams,

      // ... you can return other metadata here too.
      // note: this function will be called with various permutations of delta
      // and message args, so returning derived data .
    };
  },
});
