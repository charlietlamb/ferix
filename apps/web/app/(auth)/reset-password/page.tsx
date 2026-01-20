import { ResetPasswordCard } from "@ferix/ui/components/auth/reset-password/reset-password-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: {
    index: false,
    follow: false,
  },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return <ResetPasswordCard error={error ?? null} token={token ?? null} />;
}
