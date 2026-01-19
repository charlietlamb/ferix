"use client";

import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import { PromptList } from "@ferix/ui/components/prompts/list/prompt-list";
import { PromptListSkeleton } from "@ferix/ui/components/prompts/list/prompt-list-skeleton";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function RecentPrompts() {
  const t = useTranslations("prompts.recent");
  const { results, status } = usePaginatedQuery(
    api.prompts.list,
    { orderBy: "recent" },
    { initialNumItems: 10 }
  );
  const prompts = results as Prompt[];

  if (status === "LoadingFirstPage") {
    return <PromptListSkeleton title={t("title")} viewMorePath="recent" />;
  }

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <PromptList prompts={prompts} title={t("title")} viewMorePath="recent" />
  );
}
