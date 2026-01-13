"use client";

import { api } from "@ferix/server/_generated/api";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/header/page-header";
import { PromptGrid } from "@ferix/ui/components/prompts/prompt-grid";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export default function PopularPage() {
  const t = useTranslations("pages.popular");
  const { results, status, loadMore } = usePaginatedQuery(
    api.prompts.listPopular,
    {},
    { initialNumItems: 20 }
  );

  return (
    <div className="h-full">
      <PageHeader>
        <PageHeaderTitle>{t("title")}</PageHeaderTitle>
        <PageHeaderDescription>{t("description")}</PageHeaderDescription>
      </PageHeader>
      <PromptGrid
        hasMore={status === "CanLoadMore"}
        isLoading={status === "LoadingMore"}
        onLoadMore={() => loadMore(20)}
        prompts={results}
      />
    </div>
  );
}
