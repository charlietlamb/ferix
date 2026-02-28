"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { McpServersContent } from "@ferix/ui/components/mcp/mcp-servers-content";
import { useTranslations } from "next-intl";

export function McpPageClient() {
  const t = useTranslations("pages.mcp");

  return (
    <AppPage>
      <PageHeader className="border-border border-b">
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <McpServersContent />
    </AppPage>
  );
}
