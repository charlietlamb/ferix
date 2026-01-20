"use client";

import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { PromptGrid } from "@ferix/ui/components/prompts/grid/prompt-grid";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function RecentPageClient() {
  const t = useTranslations("pages.recent");
  const { results, status, loadMore } = usePaginatedQuery(
    api.prompts.list,
    { orderBy: "recent" },
    { initialNumItems: 20 }
  );
  const prompts = results as Prompt[];

  return (
    <AppPage>
      <PageHeader className="border-border border-b">
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <PromptGrid
        hideBorderTop
        onLoadMore={() => loadMore(20)}
        prompts={prompts}
        status={status}
      />
    </AppPage>
  );
}
