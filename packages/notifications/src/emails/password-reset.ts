import { FROM_EMAIL, resend } from "../resend";

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailParams) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your password",
    text: `Click the link to reset your password: ${resetUrl}`,
  });
}
