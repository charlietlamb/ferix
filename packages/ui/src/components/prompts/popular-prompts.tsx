"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptList } from "@ferix/ui/components/prompts/prompt-list";
import { TrendUpIcon } from "@phosphor-icons/react";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function PopularPrompts() {
  const t = useTranslations("prompts.popular");
  const { results } = usePaginatedQuery(
    api.prompts.listPopular,
    {},
    { initialNumItems: 10 }
  );

  if (!results || results.length === 0) {
    return null;
  }

  return <PromptList icon={TrendUpIcon} prompts={results} title={t("title")} />;
}
