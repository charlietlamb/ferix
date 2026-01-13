"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { Textarea } from "@ferix/ui/components/ui/textarea";
import { CopyButton } from "@ferix/ui/components/utils/copy-button";
import { usePromptDraft } from "@ferix/ui/hooks/use-prompt-draft";
import { SpinnerIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface PromptDetailContentProps {
  promptId: Id<"prompts">;
  serverContent: string;
  isCreator: boolean;
}

export function PromptDetailContent({
  promptId,
  serverContent,
  isCreator,
}: PromptDetailContentProps) {
  const t = useTranslations("promptDetail");
  const updatePrompt = useMutation(api.prompts.update);
  const [isSaving, setIsSaving] = useState(false);

  const {
    content,
    setContent,
    hasLocalChanges,
    hasUnsavedChanges,
    clearDraft,
  } = usePromptDraft({
    promptId,
    serverContent,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePrompt({ promptId, content });
      clearDraft();
      toast.success(t("saveSuccess"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="group/content flex w-full flex-col gap-4 lg:min-h-0 lg:w-[70%]">
      <div className="relative">
        <Textarea
          className="min-h-[200px] resize-none font-mono text-sm sm:min-h-[300px] lg:h-full lg:min-h-[400px]"
          disabled={!isCreator || isSaving}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          value={content}
        />
        <CopyButton
          className="absolute top-2 right-2 opacity-0 transition-opacity group-hover/content:opacity-100"
          content={content}
          promptId={promptId}
        />
      </div>
      {isCreator && (
        <div className="flex items-center justify-between pb-4">
          <span className="text-muted-foreground text-xs">
            {hasLocalChanges ? t("draftSaved") : t("noChanges")}
          </span>
          <Button
            className="min-w-30"
            disabled={!hasUnsavedChanges || isSaving}
            onClick={handleSave}
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
