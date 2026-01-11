"use client";

import { AuthFormFooter } from "@ferix/ui/components/auth/auth-form-footer";
import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SignInForm } from "../../../forms/auth/sign-in/sign-in-form";

export function SignInDialog() {
  const t = useTranslations("auth.signIn");
  const { close, open } = useDialog();

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="signInDialog"
      title={t("title")}
    >
      <SignInForm
        onForgotPassword={() => {
          close();
          open("forgotPasswordDialog");
        }}
        onSuccess={() => {
          close();
          toast.success(t("success"));
        }}
      />
      <AuthFormFooter
        mode="signIn"
        onSwitchForm={() => {
          close();
          open("signUpDialog");
        }}
      />
    </BaseDialog>
  );
}
