import type { Email } from '@ferix/types/notifications/email';
import type { ValueOf } from '@ferix/types/value-of';
import { type EmailProvider, sendEmail } from './email/providers';

export const NOTIFICATION_METHODS = {
  EMAIL: 'EMAIL',
} as const;

export type NotificationMethod = ValueOf<typeof NOTIFICATION_METHODS>;

export const sendNotification = (
  method: NotificationMethod,
  provider: EmailProvider,
  message: Email
) => {
  if (method === NOTIFICATION_METHODS.EMAIL) {
    return sendEmail(provider, message);
  }
};
