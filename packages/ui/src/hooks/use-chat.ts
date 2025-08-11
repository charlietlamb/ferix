import {
  optimisticallySendMessage,
  useThreadMessages,
} from '@convex-dev/agent/react';
import { api } from '@ferix/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState } from 'react';

export function useChat(threadId: string) {
  const [model, setModel] = useState<string>('gpt-4o');
  const status: 'error' | 'streaming' | 'submitted' | 'ready' = 'ready';

  const messages = useThreadMessages(
    api.chat.streaming.listMessages,
    { threadId },
    { initialNumItems: 10, stream: true }
  );
  const isLoadingMessages = threadId?.length && messages === undefined;
  const hasMessages = messages?.results?.length;

  const sendMessage = useMutation(
    api.chat.streaming.initiateAsyncStreaming
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.messages.listThreadMessages)
  );

  const handleSendMessage = (message: string) => {
    sendMessage({
      prompt: message,
      threadId,
    });
  };

  return {
    messages: messages?.results ?? [],
    isLoadingMessages,
    hasMessages,
    handleSendMessage,
    model,
    setModel,
    status,
  };
}
