"use client";

import { signUp } from "@ferix/auth/client";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { Result } from "better-result";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signUpFormDefaults, signUpFormSchema } from "./sign-up-form-schema";

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth.signUp");

  const form = useAppForm({
    defaultValues: signUpFormDefaults,
    validators: {
      onChange: signUpFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await Result.tryPromise(() =>
        signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        })
      );

      result.match({
        ok: () => onSuccess?.(),
        err: (e) => {
          toast.error(e.message ?? t("error"));
        },
      });
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
        {(field) => <field.TextField label={t("password")} type="password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("submit")} />
      </form.AppForm>
    </form>
  );
}
