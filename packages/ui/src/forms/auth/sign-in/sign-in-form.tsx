"use client";

import { signIn } from "@ferix/auth/client";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signInFormDefaults, signInFormSchema } from "./sign-in-form-schema";

interface SignInFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function SignInForm({ onSuccess, onForgotPassword }: SignInFormProps) {
  const t = useTranslations("auth.signIn");

  const form = useAppForm({
    defaultValues: signInFormDefaults,
    validators: {
      onChange: signInFormSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await signIn.email({
        email: value.email,
        password: value.password,
      });

      if (error) {
        toast.error(error.message ?? t("error"));
        return;
      }

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
      <form.AppField name="password">
        {(field) => (
          <field.PasswordField
            label={t("password")}
            placeholder={t("passwordPlaceholder")}
          />
        )}
      </form.AppField>
      {onForgotPassword && (
        <div className="text-right">
          <button
            className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
            onClick={onForgotPassword}
            type="button"
          >
            {t("forgotPassword")}
          </button>
        </div>
      )}
      <form.AppForm>
        <form.SubmitButton label={t("submit")} />
      </form.AppForm>
    </form>
  );
}
