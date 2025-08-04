'use client';

import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@ferix/backend/convex/_generated/api';
import type { Id } from '@ferix/backend/convex/_generated/dataModel';
import { ChatInput } from '@ferix/ui/components/chat/chat-input';
import { cn } from '@ferix/ui/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChatPreview } from './chat-preview';
import { Thread } from './thread';

export function Chat({ threadId }: { threadId?: string }) {
  const [model, setModel] = useState<string>('gpt-4o');
  const status: 'error' | 'streaming' | 'submitted' | 'ready' = 'ready';

  const { data: messages } = useQuery(
    convexQuery(api.messages.listMessages, {
      threadId: threadId as Id<'threads'>,
    })
  );

  const hasMessages = messages?.length;

  const { mutate: sendMessage } = useMutation({
    mutationFn: useConvexMutation(api.messages.sendMessage),
  });

  const handleSendMessage = (message: string) => {
    sendMessage({
      text: message,
      model,
      threadId: threadId as Id<'threads'>,
      role: 'user',
    });
  };

  return (
    <div
      className={cn(
        'relative flex size-full max-w-full flex-col transition-all duration-500',
        !hasMessages &&
          'h-full items-center justify-center gap-12 transition-all duration-500'
      )}
    >
      {hasMessages ? <Thread messages={messages} /> : <ChatPreview />}
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
