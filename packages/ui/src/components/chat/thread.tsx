import { Doc } from '@ferix/backend/convex/_generated/dataModel';
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

export function Thread({messages}: {messages: Doc<'messages'>[]}){
    return <AIConversation>
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
}