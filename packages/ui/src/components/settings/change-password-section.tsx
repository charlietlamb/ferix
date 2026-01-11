"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useHasCredentialAccount } from "@ferix/ui/hooks/use-has-credential-account";
import { useTranslations } from "next-intl";

export function ChangePasswordSection() {
  const t = useTranslations("settings.editUser");
  const { open } = useDialog();
  const hasCredentialAccount = useHasCredentialAccount();

  if (!hasCredentialAccount) {
    return null;
  }

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <p className="font-medium text-sm">{t("changePassword")}</p>
          <p className="text-muted-foreground text-xs">
            {t("changePasswordDescription")}
          </p>
        </div>
        <Button
          onClick={() => open("changePasswordDialog")}
          size="sm"
          variant="outline"
        >
          {t("changePassword")}
        </Button>
      </div>
    </div>
  );
}
