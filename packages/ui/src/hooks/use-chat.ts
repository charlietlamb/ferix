import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@ferix/backend/convex/_generated/api';
import type { Id } from '@ferix/backend/convex/_generated/dataModel';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from 'convex/react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

export function useChat(initThreadId?: string) {
  const defaultThreadId = initThreadId ?? null;
  const queryThreadId = defaultThreadId?.length ? defaultThreadId : undefined;
  const [threadId, setThreadId] = useQueryState<string | null>('threadId', {
    defaultValue: defaultThreadId,
    parse(value) {
      return value ?? defaultThreadId;
    },
  });
  const [model, setModel] = useState<string>('gpt-4o');
  const status: 'error' | 'streaming' | 'submitted' | 'ready' = 'ready';

  const messages = useQuery(api.messages.listMessages, {
    threadId: queryThreadId as Id<'threads'>,
  });
  const isLoadingMessages = threadId?.length && messages === undefined;
  const hasMessages = messages?.length;

  const { mutate: sendMessage } = useMutation({
    mutationFn: useConvexMutation(api.messages.sendMessage),
    onSuccess: (result: { threadId: string; messageId: string }) => {
      if (!threadId) {
        setThreadId(result?.threadId);
      }
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessage({
      text: message,
      model,
      threadId: queryThreadId as Id<'threads'>,
      role: 'user',
    });
  };

  return {
    messages: messages ?? [],
    isLoadingMessages,
    hasMessages,
    handleSendMessage,
    model,
    setModel,
    status,
  };
}
