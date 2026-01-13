"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { Button } from "@ferix/ui/components/ui/button";
import { Input } from "@ferix/ui/components/ui/input";
import { CopyButton } from "@ferix/ui/components/utils/copy-button";
import { useInlineEdit } from "@ferix/ui/hooks/use-inline-edit";
import {
  CheckIcon,
  PencilSimpleIcon,
  SpinnerIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface PromptDetailHeaderProps {
  promptId: Id<"prompts">;
  title: string;
  slug: string;
  type: "subagent" | "rule";
  content: string;
  isCreator: boolean;
}

export function PromptDetailHeader({
  promptId,
  title,
  slug,
  type,
  content,
  isCreator,
}: PromptDetailHeaderProps) {
  const t = useTranslations("promptDetail");
  const router = useRouter();
  const renamePrompt = useMutation(api.prompts.rename);

  const [editSlug, setEditSlug] = useState(slug);

  const titleEdit = useInlineEdit({
    initialValue: title,
    onSave: async (newTitle) => {
      const slugChanged = editSlug !== slug;
      try {
        await renamePrompt({
          promptId,
          title: newTitle.trim(),
          slug: slugChanged ? editSlug.trim() : undefined,
        });
        toast.success(t("titleSaved"));
        if (slugChanged) {
          router.replace(`/prompt/${editSlug.trim()}`);
        }
      } catch {
        toast.error(t("titleError"));
        throw new Error("Save failed");
      }
    },
    validate: (value) => value.trim() !== "" && editSlug.trim() !== "",
  });

  const handleStartEditing = () => {
    setEditSlug(slug);
    titleEdit.startEditing();
  };

  const handleCancel = () => {
    setEditSlug(slug);
    titleEdit.cancel();
  };

  return (
    <div className="flex items-center justify-between border-border border-b px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {isCreator && titleEdit.isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                className="h-8 w-full max-w-md font-medium text-lg"
                disabled={titleEdit.isSaving}
                onChange={(e) => titleEdit.setValue(e.target.value)}
                onKeyDown={titleEdit.handleKeyDown}
                placeholder={t("titlePlaceholder")}
                value={titleEdit.value}
              />
              <Button
                disabled={
                  titleEdit.isSaving ||
                  !titleEdit.value.trim() ||
                  !editSlug.trim()
                }
                onClick={titleEdit.save}
                size="icon"
                variant="ghost"
              >
                {titleEdit.isSaving ? (
                  <SpinnerIcon className="size-4 animate-spin" />
                ) : (
                  <CheckIcon className="size-4" />
                )}
              </Button>
              <Button
                disabled={titleEdit.isSaving}
                onClick={handleCancel}
                size="icon"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">/prompt/</span>
              <Input
                className="h-6 w-full max-w-xs text-muted-foreground text-xs"
                disabled={titleEdit.isSaving}
                onChange={(e) =>
                  setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                onKeyDown={titleEdit.handleKeyDown}
                placeholder="slug"
                value={editSlug}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="truncate font-medium text-lg">{title}</h1>
            <TypeBadge type={type} />
            {isCreator && (
              <Button
                className="shrink-0"
                onClick={handleStartEditing}
                size="icon"
                variant="ghost"
              >
                <PencilSimpleIcon className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <CopyButton content={content} promptId={promptId} />
    </div>
  );
}
