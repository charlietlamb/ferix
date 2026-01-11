import { ResetPasswordCard } from "@ferix/ui/components/auth/reset-password/reset-password-card";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return <ResetPasswordCard error={error ?? null} token={token ?? null} />;
}
