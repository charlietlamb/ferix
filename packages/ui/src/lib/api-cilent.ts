import type { AppType } from '@ferix/api/index';
import { hc } from 'hono/client';

export const apiClient = hc<AppType>('/api', {
  init: {
    credentials: 'include',
  },
});
