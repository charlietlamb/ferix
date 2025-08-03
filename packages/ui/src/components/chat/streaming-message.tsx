import type { StreamId } from '@convex-dev/persistent-text-streaming';
import { useStream } from '@convex-dev/persistent-text-streaming/react';
import { api } from '@ferix/backend/convex/_generated/api';
import type { Doc } from '@ferix/backend/convex/_generated/dataModel';
import { env } from '@ferix/env';
import { AIResponse } from '@ferix/ui/components/kibo-ui/ai/response';
import { useEffect, useMemo } from 'react';

export function StreamingMessage({
  message,
  isDriven,
  stopStreaming,
  scrollToBottom,
}: {
  message: Doc<'messages'>;
  isDriven: boolean;
  stopStreaming: () => void;
  scrollToBottom: () => void;
}) {
  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${env.NEXT_PUBLIC_CONVEX_SITE_URL}/chat-stream`),
    isDriven,
    message.responseStreamId as StreamId
  );

  const isCurrentlyStreaming = useMemo(() => {
    if (!isDriven) {
      return false;
    }
    return status === 'pending' || status === 'streaming';
  }, [isDriven, status]);

  useEffect(() => {
    if (!isDriven) {
      return;
    }
    if (isCurrentlyStreaming) {
      return;
    }
    stopStreaming();
  }, [isDriven, isCurrentlyStreaming, stopStreaming]);

  useEffect(() => {
    if (!text) {
      return;
    }
    scrollToBottom();
  }, [text, scrollToBottom]);

  if (status === 'error') {
    return <div className="text-red-500">Error loading response</div>;
  }

  return <AIResponse>{text || 'Thinking...'}</AIResponse>;
}
