"use client";

import { resetPassword } from "@ferix/auth/client";
import { useRouter } from "@ferix/i18n/navigation";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  resetPasswordFormDefaults,
  resetPasswordFormSchema,
} from "./reset-password-form-schema";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();

  const form = useAppForm({
    defaultValues: resetPasswordFormDefaults,
    validators: { onChange: resetPasswordFormSchema },
    onSubmit: async ({ value }) => {
      const { error } = await resetPassword({
        newPassword: value.password,
        token,
      });

      if (error) {
        toast.error(error.message ?? t("error"));
        return;
      }

      toast.success(t("success"));
      router.push("/sign-in");
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
      <form.AppField name="password">
        {(field) => <field.PasswordField label={t("password")} />}
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
