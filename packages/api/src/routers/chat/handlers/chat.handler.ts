import { openai } from '@ai-sdk/openai';
import { HttpStatusCodes } from '@ferix/http/status-codes';
import { streamText } from 'ai';
import type { AppRouteHandler } from '../../../utils/bindings';
import type { ChatRoute } from '../routes/chat.route';

export const chatHandler: AppRouteHandler<ChatRoute> = async (c) => {
  try {
    const { prompt } = await c.req.json();
    c.var.logger.info('Getting response from the AI.');

    const result = streamText({
      model: openai('gpt-4o'),
      prompt,
    });

    c.var.logger.info('Response from the AI.', {
      result,
    });

    return result.toTextStreamResponse({
      headers: {
        'Transfer-Encoding': 'chunked',
        Connection: 'keep-alive',
        'Content-Type': 'text/plain',
      },
    }) as unknown as ReturnType<AppRouteHandler<ChatRoute>>;
  } catch (error) {
    return c.json(
      { error: `Failed to get response from the AI: ${error}` },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
