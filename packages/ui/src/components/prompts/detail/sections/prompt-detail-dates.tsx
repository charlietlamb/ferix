"use client";

import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { CalendarIcon } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface PromptDetailDatesProps {
  createdAt: number;
  updatedAt: number;
}

export function PromptDetailDates({
  createdAt,
  updatedAt,
}: PromptDetailDatesProps) {
  const t = useTranslations("promptDetail");

  return (
    <PromptSection title={t("details")}>
      <div className="flex flex-col gap-2">
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
      </div>
    </PromptSection>
  );
}
