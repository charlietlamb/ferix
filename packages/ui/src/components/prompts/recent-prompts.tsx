"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptList } from "@ferix/ui/components/prompts/prompt-list";
import { ClockIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function RecentPrompts() {
  const t = useTranslations("prompts.recent");
  const prompts = useQuery(api.prompts.listRecent, { limit: 10 });

  if (!prompts) {
    return null;
  }

  return <PromptList icon={ClockIcon} prompts={prompts} title={t("title")} />;
}
