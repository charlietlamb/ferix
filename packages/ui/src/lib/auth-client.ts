import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'
import { env } from '@ferix/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [organizationClient()],
})
