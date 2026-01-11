"use client";

import { requestPasswordReset } from "@ferix/auth/client";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  forgotPasswordFormDefaults,
  forgotPasswordFormSchema,
} from "./forgot-password-form-schema";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const t = useTranslations("auth.forgotPassword");

  const form = useAppForm({
    defaultValues: forgotPasswordFormDefaults,
    validators: { onChange: forgotPasswordFormSchema },
    onSubmit: async ({ value }) => {
      const { error } = await requestPasswordReset({
        email: value.email,
        redirectTo: "/reset-password",
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
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={t("email")}
            placeholder={t("emailPlaceholder")}
            type="email"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("submit")} />
      </form.AppForm>
    </form>
  );
}
