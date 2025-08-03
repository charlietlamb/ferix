'use client';

import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@ferix/backend/convex/_generated/api';
import type { Id } from '@ferix/backend/convex/_generated/dataModel';
import { ChatInput } from '@ferix/ui/components/chat/chat-input';
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from '@ferix/ui/components/kibo-ui/ai/conversation';
import {
  AIMessage,
  AIMessageAvatar,
  AIMessageContent,
} from '@ferix/ui/components/kibo-ui/ai/message';
import { AIResponse } from '@ferix/ui/components/kibo-ui/ai/response';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function Chat({ threadId }: { threadId?: string }) {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const status: 'error' | 'streaming' | 'submitted' | 'ready' = 'ready';

  const { data: messages } = useQuery(
    convexQuery(api.messages.listMessages, {
      threadId: threadId as Id<'threads'>,
    })
  );

  const { mutate: sendMessage } = useMutation({
    mutationFn: useConvexMutation(api.messages.sendMessage),
  });

  const handleSendMessage = (message: string, model: string) => {
    setSelectedModel(model);
    sendMessage({
      text: message,
      model,
      threadId: threadId as Id<'threads'>,
      role: 'user',
    });
  };

  return (
    <div className="relative flex size-full max-w-full flex-col">
      <AIConversation>
        <AIConversationContent>
          {messages?.map((message) => (
            <AIMessage
              from={message.role === 'system' ? 'assistant' : message.role}
              key={message._id}
            >
              <AIMessageContent>
                <AIResponse>{message.text}</AIResponse>
              </AIMessageContent>
              <AIMessageAvatar
                name={message.role === 'system' ? 'assistant' : message.role}
                src=""
              />
            </AIMessage>
          ))}
          <div className="h-4" />
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
      <ChatInput
        onModelChange={setSelectedModel}
        selectedModel={selectedModel}
        sendMessage={handleSendMessage}
        status={status}
      />
    </div>
  );
}
