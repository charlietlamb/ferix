"use client";

import { api } from "@ferix/server/_generated/api";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { PromptGrid } from "@ferix/ui/components/prompts/prompt-grid";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export default function RecentPage() {
  const t = useTranslations("pages.recent");
  const { results, status, loadMore } = usePaginatedQuery(
    api.prompts.listRecent,
    {},
    { initialNumItems: 20 }
  );

  return (
    <AppPage>
      <PageHeader>
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <PromptGrid
        onLoadMore={() => loadMore(20)}
        prompts={results}
        status={status}
      />
    </AppPage>
  );
}
