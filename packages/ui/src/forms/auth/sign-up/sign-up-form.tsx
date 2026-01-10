"use client";

import { signIn, signUp } from "@ferix/auth/client";
import { Link } from "@ferix/i18n/navigation";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { Button } from "@ferix/ui/components/ui/button";
import { Separator } from "@ferix/ui/components/ui/separator";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { Result } from "better-result";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signUpFormSchema } from "./sign-up-form-schema";

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth.signUp");

  const form = useAppForm({
    defaultValues: { name: "", email: "", password: "" },
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
    <FormCard description={t("description")} title={t("title")}>
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

      <div className="relative my-4 flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-muted-foreground text-xs uppercase">
          {t("or")}
        </span>
        <Separator className="flex-1" />
      </div>

      <Button
        className="w-full"
        onClick={async () => {
          const result = await Result.tryPromise(() =>
            signIn.social({ provider: "github" })
          );
          result.match({
            ok: () => {
              toast.success(t("githubSuccess"));
            },
            err: (e) => {
              toast.error(e.message ?? t("githubError"));
            },
          });
        }}
        variant="outline"
      >
        <GithubLogoIcon className="mr-2 size-4" />
        {t("continueWithGithub")}
      </Button>

      <p className="mt-4 text-muted-foreground text-sm">
        {t("haveAccount")}{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          {t("signIn")}
        </Link>
      </p>
    </FormCard>
  );
}
