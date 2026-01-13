"use client";

import { PromptDetailSection } from "@ferix/ui/components/prompts/prompt-detail-section";
import { BookmarkSimpleIcon, DownloadIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface PromptDetailStatsProps {
  downloads: number;
  saveCount: number;
}

export function PromptDetailStats({
  downloads,
  saveCount,
}: PromptDetailStatsProps) {
  const t = useTranslations("promptDetail");

  return (
    <PromptDetailSection title={t("stats")}>
      <div className="flex items-center gap-2 text-sm">
        <DownloadIcon className="size-4 text-muted-foreground" />
        <span>{downloads.toLocaleString()}</span>
        <span className="text-muted-foreground">{t("downloads")}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <BookmarkSimpleIcon className="size-4 text-muted-foreground" />
        <span>{saveCount.toLocaleString()}</span>
        <span className="text-muted-foreground">{t("saves")}</span>
      </div>
    </PromptDetailSection>
  );
}
