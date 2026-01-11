"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { AuthFormFooter } from "@ferix/ui/components/auth/auth-form-footer";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { useTranslations } from "next-intl";
import { SignInForm } from "../../../forms/auth/sign-in/sign-in-form";

export function SignInCard({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth.signIn");
  const router = useRouter();

  return (
    <FormCard description={t("description")} title={t("title")}>
      <div>
        <SignInForm onSuccess={onSuccess} />
        <AuthFormFooter
          mode="signIn"
          onSwitchForm={() => router.push("/sign-up")}
        />
      </div>
    </FormCard>
  );
}
