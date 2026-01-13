"use client";

import { CreatePromptButton } from "@ferix/ui/components/prompts/create-prompt-button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@ferix/ui/components/ui/empty";
import { PlaceholderIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function PromptGridEmpty() {
  const t = useTranslations("prompts");

  return (
    <div className="flex flex-1 items-center justify-center border-border border-t">
      <Empty className="border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PlaceholderIcon />
          </EmptyMedia>
          <EmptyTitle>{t("empty.title")}</EmptyTitle>
          <EmptyDescription>{t("empty.description")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreatePromptButton size="sm" variant="outline">
            {t("newPrompt")}
          </CreatePromptButton>
        </EmptyContent>
      </Empty>
    </div>
  );
}
