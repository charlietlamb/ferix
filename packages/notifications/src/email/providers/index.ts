import type { Email } from '@ferix/types/notifications/email';
import type { ValueOf } from '@ferix/types/value-of';
import { sendEmailWithResend } from './resend';

export const EMAIL_PROVIDER_NAMES = {
  RESEND: 'RESEND',
} as const;

export type EmailProvider = ValueOf<typeof EMAIL_PROVIDER_NAMES>;

export const emailSenders: Record<
  (typeof EMAIL_PROVIDER_NAMES)[keyof typeof EMAIL_PROVIDER_NAMES],
  (email: Email) => Promise<void>
> = {
  RESEND: sendEmailWithResend,
};

export const sendEmail = (provider: EmailProvider, email: Email) => {
  return emailSenders[provider](email);
};
