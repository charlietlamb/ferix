import { StreamIdValidator } from '@convex-dev/persistent-text-streaming';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const MessageRole = v.union(
  v.literal('user'),
  v.literal('assistant'),
  v.literal('system')
);

export default defineSchema({
  users: defineTable({}),
  messages: defineTable({
    text: v.string(),
    model: v.string(),
    role: MessageRole,
    responseStreamId: StreamIdValidator,
    threadId: v.id('threads'),
    sentByUserId: v.id('users'),
  })
    .index('by_stream', ['responseStreamId'])
    .index('by_thread', ['threadId'])
    .index('by_sent_by_user', ['sentByUserId']),
  threads: defineTable({
    name: v.string(),
    createdByUserId: v.id('users'),
  }).index('by_name', ['name']),
});
