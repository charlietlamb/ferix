"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { TagsContent } from "@ferix/ui/components/tags/tags-content";
import { useTranslations } from "next-intl";

export default function TagsPage() {
  const t = useTranslations("pages.tags");

  return (
    <AppPage>
      <PageHeader className="border-border border-b">
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <TagsContent />
    </AppPage>
  );
}
