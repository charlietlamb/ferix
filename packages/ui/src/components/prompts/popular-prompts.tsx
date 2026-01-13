"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptList } from "@ferix/ui/components/prompts/prompt-list";
import { PromptListSkeleton } from "@ferix/ui/components/prompts/prompt-list-skeleton";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function PopularPrompts() {
  const t = useTranslations("prompts.popular");
  const { results, status } = usePaginatedQuery(
    api.prompts.listPopular,
    {},
    { initialNumItems: 10 }
  );

  if (status === "LoadingFirstPage") {
    return <PromptListSkeleton title={t("title")} viewMorePath="popular" />;
  }

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <PromptList prompts={results} title={t("title")} viewMorePath="popular" />
  );
}
