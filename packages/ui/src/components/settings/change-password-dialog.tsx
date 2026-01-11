"use client";

import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { ChangePasswordForm } from "@ferix/ui/forms/auth/change-password/change-password-form";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";

export function ChangePasswordDialog() {
  const t = useTranslations("settings.changePassword");
  const { close } = useDialog();

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="changePasswordDialog"
      title={t("title")}
    >
      <ChangePasswordForm onSuccess={close} />
    </BaseDialog>
  );
}
