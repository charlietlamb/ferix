"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { RepositoriesContent } from "@ferix/ui/components/repositories/repositories-content";
import { useTranslations } from "next-intl";

export function RepositoriesPageClient() {
  const t = useTranslations("pages.repositories");

  return (
    <AppPage>
      <PageHeader className="border-border border-b">
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <RepositoriesContent />
    </AppPage>
  );
}
