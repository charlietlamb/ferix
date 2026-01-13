"use client";

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
    <div className="flex flex-col gap-2 border-border border-b p-4">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("stats")}
      </h3>
      <div className="flex flex-col gap-2">
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
      </div>
    </div>
  );
}
