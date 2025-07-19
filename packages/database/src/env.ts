import { z } from 'zod';
import 'dotenv/config';

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string(),
});

export const databaseEnv = databaseEnvSchema.parse(process.env);
