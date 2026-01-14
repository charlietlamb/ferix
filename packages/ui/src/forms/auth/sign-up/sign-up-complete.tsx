import { RocketLaunchIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function SignUpComplete() {
  const t = useTranslations("auth.signUp");
  return (
    <div className="grid gap-4 text-center">
      <div className="flex justify-center">
        <RocketLaunchIcon className="size-12 text-primary" weight="fill" />
      </div>
      <div className="grid gap-2">
        <h3 className="font-semibold text-lg">{t("successTitle")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("successDescription")}
        </p>
      </div>
    </div>
  );
}
