import { defineConfig } from 'drizzle-kit';
import { databaseEnv } from './src/env';

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
});
