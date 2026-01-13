"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptList } from "@ferix/ui/components/prompts/prompt-list";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function RecentPrompts() {
  const t = useTranslations("prompts.recent");
  const { results } = usePaginatedQuery(
    api.prompts.listRecent,
    {},
    { initialNumItems: 10 }
  );

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <PromptList prompts={results} title={t("title")} viewMorePath="recent" />
  );
}
