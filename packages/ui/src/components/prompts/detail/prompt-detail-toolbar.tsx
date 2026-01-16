"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { FileTextIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface PromptDetailToolbarProps {
  slug: string;
  canEdit: boolean;
  hasLocalChanges: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function PromptDetailToolbar({
  slug,
  canEdit,
  hasLocalChanges,
  hasUnsavedChanges,
  isSaving,
  onSave,
}: PromptDetailToolbarProps) {
  const t = useTranslations("promptDetail");

  return (
    <div className="flex items-center justify-between border-border border-b px-4 py-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <FileTextIcon className="size-4" />
        <span>{slug}.md</span>
      </div>
      {canEdit && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {hasLocalChanges ? t("draftSaved") : t("noChanges")}
          </span>
          <Button
            disabled={!hasUnsavedChanges || isSaving}
            onClick={onSave}
            size="sm"
            variant="ghost"
          >
            {isSaving ? (
              <SpinnerIcon className="size-4 animate-spin" />
            ) : (
              t("saveChanges")
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
