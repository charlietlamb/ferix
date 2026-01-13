"use client";

import { PromptDetailSection } from "@ferix/ui/components/prompts/prompt-detail-section";
import { CalendarIcon } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface PromptDetailDetailsProps {
  createdAt: number;
  updatedAt: number;
}

export function PromptDetailDetails({
  createdAt,
  updatedAt,
}: PromptDetailDetailsProps) {
  const t = useTranslations("promptDetail");

  return (
    <PromptDetailSection title={t("details")}>
      <div className="flex items-center gap-2 text-sm">
        <CalendarIcon className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">{t("lastEdited")}</span>
        <span>{formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <CalendarIcon className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">{t("created")}</span>
        <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
      </div>
    </PromptDetailSection>
  );
}
