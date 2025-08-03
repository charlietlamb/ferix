import type { StreamId } from '@convex-dev/persistent-text-streaming';
import { env } from '@ferix/env';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { convertToModelMessages, streamText } from 'ai';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { streamingComponent } from './streaming';

export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as {
    streamId: string;
  };

  // Start streaming and persisting at the same time while
  // we immediately return a streaming response to the client
  const response = await streamingComponent.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (context, _request, _streamId, append) => {
      const model = 'gpt-4o';
      const history = await context.runQuery(internal.messages.getHistory);

      const messages = history;

      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });

      const result = streamText({
        model: openrouter(model),
        messages: convertToModelMessages(messages),
      });

      for await (const textChunk of result.textStream) {
        await append(textChunk);
      }
    }
  );

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Vary', 'Origin');

  return response;
});
