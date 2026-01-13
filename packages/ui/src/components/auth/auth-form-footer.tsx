"use client";

import { signIn } from "@ferix/auth/client";
import { Button } from "@ferix/ui/components/ui/button";
import { Separator } from "@ferix/ui/components/ui/separator";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface AuthFormFooterProps {
  mode: "signIn" | "signUp";
  onSwitchForm: () => void;
}

export function AuthFormFooter({ mode, onSwitchForm }: AuthFormFooterProps) {
  const t = useTranslations(`auth.${mode}`);
  const [isLoading, setIsLoading] = useState(false);

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    const callbackURL = window.location.pathname + window.location.search;
    const { error } = await signIn.social({
      provider: "github",
      callbackURL,
    });
    if (error) {
      toast.error(error.message ?? t("githubError"));
      setIsLoading(false);
    }
  };

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
        disabled={isLoading}
        onClick={handleGithubSignIn}
        variant="outline"
      >
        {isLoading ? (
          <Spinner className="mr-2" />
        ) : (
          <GithubLogoIcon className="mr-2 size-4" />
        )}
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
