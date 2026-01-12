"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptList } from "@ferix/ui/components/prompts/prompt-list";
import { TrendUpIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function PopularPrompts() {
  const t = useTranslations("prompts.popular");
  const prompts = useQuery(api.prompts.listPopular, { limit: 10 });

  if (!prompts) {
    return null;
  }

  return <PromptList icon={TrendUpIcon} prompts={prompts} title={t("title")} />;
}
