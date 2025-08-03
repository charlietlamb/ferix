import { betterFetch } from '@better-fetch/fetch';
import { env } from '@ferix/env';
import { z } from 'zod';

export function listOrganizations(headers: Headers) {
  return betterFetch('/api/auth/organization/list', {
    baseURL: env.NEXT_PUBLIC_BASE_URL,
    headers,
    output: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        createdAt: z.coerce.string(),
        updatedAt: z.coerce.string().optional(),
      })
    ),
  });
}
