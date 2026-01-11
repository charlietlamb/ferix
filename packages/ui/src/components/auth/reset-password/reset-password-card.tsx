"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { Button } from "@ferix/ui/components/ui/button";
import { ResetPasswordForm } from "@ferix/ui/forms/auth/reset-password/reset-password-form";
import { useTranslations } from "next-intl";

interface ResetPasswordCardProps {
  token: string | null;
  error: string | null;
}

export function ResetPasswordCard({ token, error }: ResetPasswordCardProps) {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();

  if (error || !token) {
    return (
      <FormCard description={t("invalidToken")} title={t("title")}>
        <Button
          className="w-full"
          onClick={() => router.push("/sign-in")}
          variant="outline"
        >
          {t("backToSignIn")}
        </Button>
      </FormCard>
    );
  }

  return (
    <FormCard description={t("description")} title={t("title")}>
      <ResetPasswordForm token={token} />
    </FormCard>
  );
}
