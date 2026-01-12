"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptGrid } from "@ferix/ui/components/prompts/prompt-grid";
import { ClockIcon } from "@phosphor-icons/react";
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClockIcon className="size-6" />
        <h1 className="text-lg">{t("title")}</h1>
      </div>
      <PromptGrid
        hasMore={status === "CanLoadMore"}
        isLoading={status === "LoadingMore"}
        onLoadMore={() => loadMore(20)}
        prompts={results}
      />
    </div>
  );
}
