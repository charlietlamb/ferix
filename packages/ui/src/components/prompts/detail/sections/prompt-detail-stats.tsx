"use client";

import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { StatRow } from "@ferix/ui/components/prompts/shared/stat-row";
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
    <PromptSection title={t("stats")}>
      <div className="flex flex-col gap-2">
        <StatRow
          icon={DownloadIcon}
          label={t("downloads")}
          value={downloads.toLocaleString()}
        />
        <StatRow
          icon={BookmarkSimpleIcon}
          label={t("saves")}
          value={saveCount.toLocaleString()}
        />
      </div>
    </PromptSection>
  );
}
