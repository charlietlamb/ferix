"use client";

import { AuthFormFooter } from "@ferix/ui/components/auth/auth-form-footer";
import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";
import { SignUpForm } from "../../../forms/auth/sign-up/sign-up-form";

export function SignUpDialog() {
  const t = useTranslations("auth.signUp");
  const { close, open } = useDialog();

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="signUpDialog"
      title={t("title")}
    >
      <SignUpForm />
      <AuthFormFooter
        mode="signUp"
        onSwitchForm={() => {
          close();
          open("signInDialog");
        }}
      />
    </BaseDialog>
  );
}
