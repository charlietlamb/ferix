import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { env } from "@ferix/env/convex";
import { sendPasswordResetEmail } from "@ferix/notifications/emails/password-reset";
import { sendVerificationEmail } from "@ferix/notifications/emails/verification";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { admin, deviceAuthorization, username } from "better-auth/plugins";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import { generateUniqueUsername } from "./users";

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  }
);

/**
 * Full auth options with all runtime configuration.
 * Used by createAuth for actual Better Auth initialization.
 */
export const createAuthOptions = (
  ctx: GenericCtx<DataModel>
): BetterAuthOptions => {
  return {
    baseURL: `${env.FRONTEND_URL}/api/auth`,
    trustedOrigins: [env.FRONTEND_URL],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({ to: user.email, resetUrl: url });
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        const verifyUrl = new URL(url);
        verifyUrl.searchParams.set("callbackURL", "/?verified=true");
        await sendVerificationEmail({
          to: user.email,
          verifyUrl: verifyUrl.toString(),
        });
      },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (user.username) {
              return { data: user };
            }

            const generatedUsername = await generateUniqueUsername(
              ctx.runQuery,
              user.name
            );

            return {
              data: {
                ...user,
                username: generatedUsername,
                displayUsername: generatedUsername,
              },
            };
          },
        },
      },
    },
    plugins: [
      convex({ authConfig }),
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
      }),
      admin(),
      deviceAuthorization({
        verificationUri: `${env.FRONTEND_URL}/device`,
      }),
    ],
  };
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

export type Auth = ReturnType<typeof createAuth>;

export const getCurrentUser = query({
  args: {},
  handler: (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
