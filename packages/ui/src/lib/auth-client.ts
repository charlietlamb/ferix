import { createAuthClient } from 'better-auth/client'
import { organizationClient } from 'better-auth/client/plugins'
import { env } from '@ferix/env'

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: env.NEXT_PUBLIC_BASE_URL,
    plugins: [organizationClient()],
  }
)
