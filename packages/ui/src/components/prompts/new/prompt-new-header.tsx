"use client";

import { PromptTypeSelect } from "@ferix/ui/components/prompts/shared/prompt-type-select";
import { Input } from "@ferix/ui/components/ui/input";
import type { PromptType } from "@ferix/ui/lib/prompt-types";
import { useTranslations } from "next-intl";

interface PromptNewHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  type: PromptType;
  onTypeChange: (type: PromptType) => void;
}

export function PromptNewHeader({
  title,
  onTitleChange,
  type,
  onTypeChange,
}: PromptNewHeaderProps) {
  const t = useTranslations("promptNew");

  return (
    <div className="flex items-center justify-between border-border border-b p-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          autoFocus
          className="h-auto min-w-0 flex-1 truncate border-0 bg-transparent p-0 font-medium text-lg shadow-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent"
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("titlePlaceholder")}
          value={title}
        />
        <PromptTypeSelect onChange={onTypeChange} value={type} />
      </div>
    </div>
  );
}
