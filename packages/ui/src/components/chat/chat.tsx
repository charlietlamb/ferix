'use client';

import { toUIMessages } from '@convex-dev/agent/react';
import { ChatInput } from '@ferix/ui/components/chat/chat-input';
import { useChat } from '@ferix/ui/hooks/use-chat';
import { useUser } from '@ferix/ui/hooks/use-user';
import { cn } from '@ferix/ui/lib/utils';
import { Loading } from '../utility/loading/loading';
import { ChatPreview } from './chat-preview';
import { Thread } from './thread';

export function Chat({ threadId }: { threadId: string }) {
  const { user, isLoading: isLoadingUser } = useUser();
  const {
    messages,
    isLoadingMessages,
    hasMessages,
    handleSendMessage,
    model,
    setModel,
    status,
  } = useChat(threadId);

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
        <Thread messages={toUIMessages(messages)} />
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
