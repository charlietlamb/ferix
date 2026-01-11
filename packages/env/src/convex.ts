import { z } from "zod/v4";

const schema = z.object({
  CONVEX_CLOUD_URL: z.url(),
  CONVEX_SITE_URL: z.url(),
  FRONTEND_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

export const env = schema.parse(process.env);
