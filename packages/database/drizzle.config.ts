import { defineConfig } from 'drizzle-kit'
import { databaseEnv } from './src/env'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
})
