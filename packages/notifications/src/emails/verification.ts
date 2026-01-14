import { FROM_EMAIL, resend } from "../resend";

interface SendVerificationEmailParams {
  to: string;
  verifyUrl: string;
}

export async function sendVerificationEmail({
  to,
  verifyUrl,
}: SendVerificationEmailParams) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your email",
    text: `Click the link to verify your email: ${verifyUrl}`,
  });
}
