"use client";

import { signIn } from "@ferix/auth/client";
import { Link } from "@ferix/i18n/navigation";
import { FormCard } from "@ferix/ui/components/form/form-card";
import { Button } from "@ferix/ui/components/ui/button";
import { Separator } from "@ferix/ui/components/ui/separator";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { GithubLogoIcon } from "@phosphor-icons/react";

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      const { error } = await signIn.email({
        email: value.email,
        password: value.password,
      });
      if (!error) {
        onSuccess?.();
      }
    },
  });

  return (
    <FormCard description="Enter your credentials to continue" title="Sign In">
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
              label="Email"
              placeholder="you@example.com"
              type="email"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.TextField label="Password" type="password" />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Sign In" />
        </form.AppForm>
      </form>

      <div className="relative my-4 flex items-center">
        <Separator className="flex-1" />
        <span className="px-3 text-muted-foreground text-xs uppercase">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        className="w-full"
        onClick={() => signIn.social({ provider: "github" })}
        variant="outline"
      >
        <GithubLogoIcon className="mr-2 size-4" />
        Continue with GitHub
      </Button>

      <p className="mt-4 text-muted-foreground text-sm">
        Don&apos;t have an account?{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href="/sign-up"
        >
          Sign up
        </Link>
      </p>
    </FormCard>
  );
}
