"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { AuthFormFooter } from "@ferix/ui/components/auth/auth-form-footer";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { useTranslations } from "next-intl";
import { SignUpForm } from "../../../forms/auth/sign-up/sign-up-form";

export function SignUpCard({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth.signUp");
  const router = useRouter();

  return (
    <FormCard description={t("description")} title={t("title")}>
      <div>
        <SignUpForm onSuccess={onSuccess} />
        <AuthFormFooter
          mode="signUp"
          onSwitchForm={() => router.push("/sign-in")}
        />
      </div>
    </FormCard>
  );
}
