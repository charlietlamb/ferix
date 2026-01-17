"use client";

import { DirectoriesContent } from "@ferix/ui/components/directories/directories-content";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { useTranslations } from "next-intl";

export default function DirectoriesPage() {
  const t = useTranslations("pages.directories");

  return (
    <AppPage>
      <PageHeader className="border-border border-b">
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <DirectoriesContent />
    </AppPage>
  );
}
