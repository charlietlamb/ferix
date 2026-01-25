"use client";

import { PromptSection } from "@ferix/ui/components/prompts/shared/prompt-section";
import { StatRow } from "@ferix/ui/components/prompts/shared/stat-row";
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
        <StatRow
          icon={CalendarIcon}
          label={t("lastEdited")}
          labelFirst
          value={formatDistanceToNow(updatedAt, { addSuffix: true })}
        />
        <StatRow
          icon={CalendarIcon}
          label={t("created")}
          labelFirst
          value={formatDistanceToNow(createdAt, { addSuffix: true })}
        />
      </div>
    </PromptSection>
  );
}
