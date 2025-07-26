import { schema } from '@ferix/database/db/schema';
import { db } from '@ferix/database/index';
import { env } from '@ferix/env';
import {
  NOTIFICATION_METHODS,
  sendNotification,
} from '@ferix/notifications/index';
import { EMAIL_PROVIDER_NAMES } from '@ferix/notifications/methods/email/index';
import { inviteOrganizationMemberTemplate } from '@ferix/notifications/templates/invite-organization-member';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI, organization } from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
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
  ],
  emailAndPassword: {
    enabled: true,
    maxPasswordLength: 100,
    minPasswordLength: 8,
  },
  advanced: {
    cookiePrefix: 'ferix',
  },
  trustedOrigins: [env.NEXT_PUBLIC_BASE_URL],
});
