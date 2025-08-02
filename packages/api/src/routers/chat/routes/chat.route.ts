import { HttpStatusCodes } from '@ferix/http/status-codes';
import { createRoute, z } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';

const tags = ['chat'];

export const chatRoute = createRoute({
  path: '/chat',
  method: 'post',
  summary: 'Get a streamed response from the AI',
  tags,
  request: {
    body: jsonContent(
      z.object({
        id: z.string().optional(),
        messages: z.array(
          z.object({
            id: z.string(),
            role: z.enum(['user', 'assistant', 'system']),
            parts: z.array(
              z.object({
                type: z.string(),
                text: z.string().optional(),
              })
            ),
          })
        ),
        trigger: z.string().optional(),
      }),
      'Chat messages for the AI.'
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'text/event-stream': {
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

export type ChatRoute = typeof chatRoute;
