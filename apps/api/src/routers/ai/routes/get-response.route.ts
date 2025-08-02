import { HttpStatusCodes } from '@ferix/http/status-codes';
import { createRoute, z } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';

const tags = ['ai'];

export const getResponseRoute = createRoute({
  path: '/ai/get-response',
  method: 'post',
  summary: 'Get a streamed response from the OpenAI API',
  tags,
  request: {
    body: jsonContent(
      z.object({
        prompt: z.string().min(1, 'Prompt is required'),
      }),
      'Prompt for the AI.'
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'text/plain': {
          schema: z.string(),
          description: 'Streamed response from the AI.',
        },
      },
      description: 'Streamed response from the AI.',
    },
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        error: z.string(),
      }),
      'Failed to get response from the AI.'
    ),
  },
});
