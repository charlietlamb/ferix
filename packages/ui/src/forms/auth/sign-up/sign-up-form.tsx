"use client";

import { signUp } from "@ferix/auth/client";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { SignUpComplete } from "./sign-up-complete";
import { signUpFormDefaults, signUpFormSchema } from "./sign-up-form-schema";

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const [isComplete, setIsComplete] = useState(false);

  const form = useAppForm({
    defaultValues: signUpFormDefaults,
    validators: {
      onChange: signUpFormSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (error) {
        toast.error(error.message ?? t("error"));
        return;
      }

      setIsComplete(true);
    },
  });

  if (isComplete) {
    return <SignUpComplete />;
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => <field.TextField label={t("name")} type="text" />}
      </form.AppField>
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
      <form.AppForm>
        <form.SubmitButton label={t("submit")} />
      </form.AppForm>
    </form>
  );
}
