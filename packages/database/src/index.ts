import { drizzle as hostedDrizzle } from 'drizzle-orm/neon-http'
import { drizzle as localDrizzle } from 'drizzle-orm/node-postgres'
import { databaseEnv } from './env'

const isLocal = databaseEnv.DATABASE_URL.includes('localhost')
console.log('isLocal', isLocal)
const drizzle = isLocal ? localDrizzle : hostedDrizzle

// @ts-expect-error - drizzle is not typed correctly
export const db = drizzle(databaseEnv.DATABASE_URL)
