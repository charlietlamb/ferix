import { createAuthClient } from 'better-auth/react'
import { env } from '@ferix/env'

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: env.NEXT_PUBLIC_BASE_URL,
  }
)
