import { env } from '@ferix/env';
import {
  genericOAuthClient,
  organizationClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [organizationClient(), genericOAuthClient()],
});
