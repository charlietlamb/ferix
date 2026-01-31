import { z } from "zod/v4";

const schema = z.object({
  FRONTEND_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CLI_CLIENT_IDS: z.string().optional(),
});

export const env = schema.parse(process.env);
