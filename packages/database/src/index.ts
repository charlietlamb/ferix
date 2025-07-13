import { drizzle } from 'drizzle-orm/neon-http'
import { databaseEnv } from './env'

export const db = drizzle(databaseEnv.DATABASE_URL)
