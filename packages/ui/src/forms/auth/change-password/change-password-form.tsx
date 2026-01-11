"use client";

import { changePassword } from "@ferix/auth/client";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  changePasswordFormDefaults,
  changePasswordFormSchema,
} from "./change-password-form-schema";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const t = useTranslations("settings.changePassword");

  const form = useAppForm({
    defaultValues: changePasswordFormDefaults,
    validators: { onChange: changePasswordFormSchema },
    onSubmit: async ({ value }) => {
      const { error } = await changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(error.message ?? t("error"));
        return;
      }

      toast.success(t("success"));
      onSuccess?.();
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="currentPassword">
        {(field) => <field.PasswordField label={t("currentPassword")} />}
      </form.AppField>
      <form.AppField name="newPassword">
        {(field) => <field.PasswordField label={t("newPassword")} />}
      </form.AppField>
      <form.AppField name="confirmPassword">
        {(field) => <field.PasswordField label={t("confirmPassword")} />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("submit")} />
      </form.AppForm>
    </form>
  );
}
