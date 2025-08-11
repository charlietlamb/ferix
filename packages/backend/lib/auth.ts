import { convexAdapter } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { api } from '@ferix/backend/convex/_generated/api';
import type { Id } from '@ferix/backend/convex/_generated/dataModel';
import { env } from '@ferix/env';
import {
  NOTIFICATION_METHODS,
  sendNotification,
} from '@ferix/notifications/index';
import { EMAIL_PROVIDER_NAMES } from '@ferix/notifications/methods/email/index';
import { inviteOrganizationMemberTemplate } from '@ferix/notifications/templates/invite-organization-member';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { openAPI, organization } from 'better-auth/plugins';
import type { GenericCtx } from '../convex/_generated/server';
import { betterAuthComponent } from '../convex/auth';

const createOptions = (ctx: GenericCtx) =>
  ({
    baseURL: env.NEXT_PUBLIC_BASE_URL,
    database: convexAdapter(ctx, betterAuthComponent),
    plugins: [
      organization({
        teams: { enabled: true },
        sendInvitationEmail: async (data) => {
          const {
            organization: { name: organizationName },
            inviter,
            invitation,
          } = data;
          const { subject, html, content } = inviteOrganizationMemberTemplate(
            organizationName,
            inviter.user.name,
            invitation.id
          );
          await sendNotification(
            NOTIFICATION_METHODS.EMAIL,
            EMAIL_PROVIDER_NAMES.RESEND,
            {
              to: [data.email],
              from: 'Ferix AI <no-reply@ferix.ai>',
              subject,
              html,
              text: content,
            }
          );
        },
      }),
      openAPI(),
      convex(),
    ],
    emailAndPassword: {
      enabled: true,
      maxPasswordLength: 100,
      minPasswordLength: 8,
    },
    advanced: {
      cookiePrefix: 'ferix',
      useSecureCookies: true,
    },
    trustedOrigins: [env.NEXT_PUBLIC_BASE_URL, 'http://localhost:3003'],
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            return {
              data: {
                ...session,
                activeOrganizationId: await ctx.runQuery(
                  api.auth.getActiveOrganizationId,
                  {
                    userId: session.userId as Id<'users'>,
                  }
                ),
              },
            };
          },
        },
      },
    },
  }) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx) => {
  const options = createOptions(ctx);
  return betterAuth({
    ...options,
    plugins: [...options.plugins, convex({ options })],
  });
};

export const getAuthUserId = async (ctx: GenericCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.subject as Id<'users'>;
  return userId;
};
