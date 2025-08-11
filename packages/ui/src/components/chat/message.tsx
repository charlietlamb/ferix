import { type UIMessage, useSmoothText } from '@convex-dev/agent/react';
import { AIResponse } from '../kibo-ui/ai/response';

export function Message({
  message,
}: {
  message: UIMessage & { content: string };
}) {
  const [visibleText] = useSmoothText(message.content, {
    startStreaming: message.status === 'streaming',
  });
  return <AIResponse>{visibleText}</AIResponse>;
}
