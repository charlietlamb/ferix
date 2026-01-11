"use client";

import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { ForgotPasswordForm } from "@ferix/ui/forms/auth/forgot-password/forgot-password-form";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function ForgotPasswordDialog() {
  const t = useTranslations("auth.forgotPassword");
  const { close, open } = useDialog();

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="forgotPasswordDialog"
      title={t("title")}
    >
      <ForgotPasswordForm onSuccess={close} />
      <button
        className="mt-4 flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary"
        onClick={() => {
          close();
          open("signInDialog");
        }}
        type="button"
      >
        <ArrowLeftIcon className="size-4" />
        {t("backToSignIn")}
      </button>
    </BaseDialog>
  );
}
