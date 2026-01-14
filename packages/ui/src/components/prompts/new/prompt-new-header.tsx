"use client";

import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { Input } from "@ferix/ui/components/ui/input";
import { useTranslations } from "next-intl";

interface PromptNewHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export function PromptNewHeader({
  title,
  onTitleChange,
}: PromptNewHeaderProps) {
  const t = useTranslations("promptNew");

  return (
    <div className="flex items-center justify-between border-border border-b p-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          autoFocus
          className="h-auto border-0 bg-transparent p-0 font-medium text-lg shadow-none focus-visible:ring-0"
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("titlePlaceholder")}
          value={title}
        />
        <TypeBadge type="subagent" />
      </div>
    </div>
  );
}
