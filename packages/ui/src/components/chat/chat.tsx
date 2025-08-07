'use client';

import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@ferix/backend/convex/_generated/api';
import type { Id } from '@ferix/backend/convex/_generated/dataModel';
import { ChatInput } from '@ferix/ui/components/chat/chat-input';
import { useUser } from '@ferix/ui/hooks/use-user';
import { cn } from '@ferix/ui/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from 'convex/react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { Loading } from '../utility/loading/loading';
import { ChatPreview } from './chat-preview';
import { Thread } from './thread';

export function Chat({ initThreadId }: { initThreadId?: string }) {
  const { user, isLoading: isLoadingUser } = useUser();
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

  if (isLoadingUser || isLoadingMessages) {
    return <Loading />;
  }

  return (
    <div
      className={cn(
        'relative flex size-full max-w-full flex-col transition-all duration-500',
        !hasMessages &&
          'h-full items-center justify-center gap-12 transition-all duration-500'
      )}
    >
      {hasMessages ? (
        <Thread messages={messages} />
      ) : (
        <ChatPreview user={user} />
      )}
      <ChatInput
        className="transition-all duration-500"
        onModelChange={setModel}
        selectedModel={model}
        sendMessage={handleSendMessage}
        status={status}
      />
    </div>
  );
}
