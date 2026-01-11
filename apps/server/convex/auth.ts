import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { env } from "@ferix/env/convex";
import { sendPasswordResetEmail } from "@ferix/notifications/emails/password-reset";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: `${env.FRONTEND_URL}/api/auth`,
    trustedOrigins: [env.FRONTEND_URL],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({ to: user.email, resetUrl: url });
      },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    plugins: [convex({ authConfig })],
  });
};

export type Auth = ReturnType<typeof createAuth>;

export const getCurrentUser = query({
  args: {},
  handler: (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
