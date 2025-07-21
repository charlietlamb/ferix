import { env } from '@ferix/env';
import type { Email } from '@ferix/types/notifications/email';
import { Resend } from 'resend';

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmailWithResend(email: Email) {
  await resend.emails.send({
    from: 'Ferix AI <no-reply@ferix.ai>',
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}
