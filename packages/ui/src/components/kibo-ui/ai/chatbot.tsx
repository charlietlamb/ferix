'use client';

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
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChatInput } from '../../chat/chat-input';
import { useState } from 'react';

export function Chatbot() {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const handleSendMessage = (message: string, model: string) => {
    setSelectedModel(model);
    sendMessage({ 
      text: message,
      metadata: { model }
    });
  };

  return (
    <div className="relative flex size-full flex-col max-w-full">
      <AIConversation>
        <AIConversationContent>
          {messages.map((message) => (
            <AIMessage key={message.id} from={message.role === 'system' ? 'assistant' : message.role}>
              <AIMessageContent>
                <AIResponse>
                  {message.parts?.map((part) => 
                    part.type === 'text' ? part.text : ''
                  ).join('')}
                </AIResponse>
              </AIMessageContent>
              <AIMessageAvatar name={message.role === 'system' ? 'assistant' : message.role} src="" />
            </AIMessage>
          ))}
          <div className="h-4" />
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
      <ChatInput 
        status={status} 
        sendMessage={handleSendMessage}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
