"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import { Button } from "@ferix/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ferix/ui/components/ui/empty";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { LockIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function PromptNewAuthGuard() {
  const t = useTranslations("promptNew.authRequired");
  const { open: openDialog } = useDialog();

  return (
    <AppPage>
      <div className="flex flex-1 items-center justify-center">
        <Empty className="border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LockIcon />
            </EmptyMedia>
            <EmptyTitle>{t("title")}</EmptyTitle>
            <EmptyDescription>{t("description")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => openDialog("signInDialog")}>
              {t("signIn")}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </AppPage>
  );
}
