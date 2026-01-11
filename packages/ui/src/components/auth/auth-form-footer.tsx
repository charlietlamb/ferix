"use client";

import { signIn } from "@ferix/auth/client";
import { Button } from "@ferix/ui/components/ui/button";
import { Separator } from "@ferix/ui/components/ui/separator";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { Result } from "better-result";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface AuthFormFooterProps {
  mode: "signIn" | "signUp";
  onSwitchForm: () => void;
}

export function AuthFormFooter({ mode, onSwitchForm }: AuthFormFooterProps) {
  const t = useTranslations(`auth.${mode}`);

  return (
    <>
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
            ok: () => toast.success(t("githubSuccess")),
            err: (e) => toast.error(e.message ?? t("githubError")),
          });
        }}
        variant="outline"
      >
        <GithubLogoIcon className="mr-2 size-4" />
        {t("continueWithGithub")}
      </Button>

      <p className="mt-4 text-muted-foreground text-sm">
        {mode === "signIn" ? t("noAccount") : t("haveAccount")}{" "}
        <button
          className="text-primary underline-offset-4 hover:underline"
          onClick={onSwitchForm}
          type="button"
        >
          {mode === "signIn" ? t("signUp") : t("signIn")}
        </button>
      </p>
    </>
  );
}
