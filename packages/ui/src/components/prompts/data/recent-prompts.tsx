"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptList } from "@ferix/ui/components/prompts/list/prompt-list";
import { PromptListSkeleton } from "@ferix/ui/components/prompts/list/prompt-list-skeleton";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function RecentPrompts() {
  const t = useTranslations("prompts.recent");
  const { results, status } = usePaginatedQuery(
    api.prompts.listRecent,
    {},
    { initialNumItems: 10 }
  );

  if (status === "LoadingFirstPage") {
    return <PromptListSkeleton title={t("title")} viewMorePath="recent" />;
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <PromptList prompts={results} title={t("title")} viewMorePath="recent" />
  );
}
