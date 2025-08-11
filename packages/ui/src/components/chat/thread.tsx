import type { UIMessage } from '@convex-dev/agent/react';
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
import { Message } from './message';

export function Thread({ messages }: { messages: UIMessage[] }) {
  return (
    <AIConversation>
      <AIConversationContent>
        {messages?.map((message) => (
          <AIMessage
            from={message.role === 'system' ? 'assistant' : message.role}
            key={message.id}
          >
            <AIMessageContent>
              <Message message={message as UIMessage & { content: string }} />
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
  );
}
