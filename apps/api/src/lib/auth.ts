import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@ferix/database/index'
import * as schema from '@ferix/database/db/schema'
import { openAPI, organization } from 'better-auth/plugins'
import { env } from '@ferix/env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  plugins: [
    organization({
      teams: { enabled: true },
    }),
    openAPI(),
  ],
  emailAndPassword: {
    enabled: true,
    maxPasswordLength: 100,
    minPasswordLength: 8,
  },
  advanced: {
    cookiePrefix: 'ferix',
  },
  trustedOrigins: [env.NEXT_PUBLIC_BASE_URL],
})
