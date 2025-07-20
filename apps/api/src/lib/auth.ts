import { schema } from '@ferix/database/db/schema';
import { db } from '@ferix/database/index';
import { env } from '@ferix/env';
import { EMAIL_PROVIDER_NAMES } from '@ferix/notifications/email/providers';
import {
  NOTIFICATION_METHODS,
  sendNotification,
} from '@ferix/notifications/index';
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
        await sendNotification(
          NOTIFICATION_METHODS.EMAIL,
          EMAIL_PROVIDER_NAMES.RESEND,
          data
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
