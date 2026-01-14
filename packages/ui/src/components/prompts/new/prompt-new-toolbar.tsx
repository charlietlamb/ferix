"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { FileTextIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import slugify from "slugify";

interface PromptNewToolbarProps {
  title: string;
  canCreate: boolean;
  hasLocalChanges: boolean;
  isCreating: boolean;
  onCreate: () => void;
}

export function PromptNewToolbar({
  title,
  canCreate,
  hasLocalChanges,
  isCreating,
  onCreate,
}: PromptNewToolbarProps) {
  const t = useTranslations("promptNew");

  const displaySlug = title.trim()
    ? slugify(title, { lower: true, strict: true })
    : "new-prompt";

  return (
    <div className="flex items-center justify-between border-border border-b px-4 py-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <FileTextIcon className="size-4" />
        <span>{displaySlug}.md</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">
          {hasLocalChanges ? t("draftSaved") : ""}
        </span>
        <Button
          disabled={!canCreate || isCreating}
          onClick={onCreate}
          size="sm"
          variant="ghost"
        >
          {isCreating ? (
            <>
              <Spinner className="mr-2" />
              {t("creating")}
            </>
          ) : (
            t("create")
          )}
        </Button>
      </div>
    </div>
  );
}
