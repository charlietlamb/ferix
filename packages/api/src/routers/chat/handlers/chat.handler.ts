import { env } from '@ferix/env';
import { HttpStatusCodes } from '@ferix/http/status-codes';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { convertToModelMessages, streamText } from 'ai';
import type { AppRouteHandler } from '../../../utils/bindings';
import type { ChatRoute } from '../routes/chat.route';

export const chatHandler: AppRouteHandler<ChatRoute> = async (c) => {
  try {
    const { messages } = await c.req.json();
    const model = messages.at(-1)?.metadata?.model || 'gpt-4o';

    const openrouter = createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });

    const result = streamText({
      model: openrouter(model),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse() as unknown as ReturnType<
      AppRouteHandler<ChatRoute>
    >;
  } catch (error) {
    return c.json(
      { error: `Failed to get response from the AI: ${error}` },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
