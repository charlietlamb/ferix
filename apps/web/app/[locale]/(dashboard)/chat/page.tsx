import { getToken } from '@convex-dev/better-auth/nextjs';
import { api } from '@ferix/backend/convex/_generated/api';
import { createAuth } from '@ferix/backend/lib/auth';
import { Chat } from '@ferix/ui/components/chat/chat';
import { fetchMutation } from 'convex/nextjs';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ threadId: string }>;
}) {
  const query = await searchParams;
  if (query.threadId) {
    return <Chat threadId={query.threadId} />;
  }

  const token = await getToken(createAuth);
  const threadId = await fetchMutation(
    api.chat.threads.createNewThread,
    {},
    {
      token,
    }
  );
  return <Chat threadId={threadId} />;
}
