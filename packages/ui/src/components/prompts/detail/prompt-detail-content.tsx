"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptDetailHeader } from "@ferix/ui/components/prompts/detail/prompt-detail-header";
import { PromptDetailToolbar } from "@ferix/ui/components/prompts/detail/prompt-detail-toolbar";
import { Textarea } from "@ferix/ui/components/ui/textarea";
import { CopyButton } from "@ferix/ui/components/utils/copy-button";
import { usePromptDraft } from "@ferix/ui/hooks/use-prompt-draft";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface PromptDetailContentProps {
  promptId: Id<"prompts">;
  serverContent: string;
  isCreator: boolean;
  title: string;
  slug: string;
  type: "subagent" | "rule";
}

export function PromptDetailContent({
  promptId,
  serverContent,
  isCreator,
  title,
  slug,
  type,
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
    <div className="flex min-h-[400px] flex-1 flex-col md:min-h-0">
      <PromptDetailHeader
        content={content}
        promptId={promptId}
        slug={slug}
        title={title}
        type={type}
      />

      <PromptDetailToolbar
        hasLocalChanges={hasLocalChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        isCreator={isCreator}
        isSaving={isSaving}
        onSave={handleSave}
        slug={slug}
      />

      {/* Textarea */}
      <div className="group/textarea relative min-h-0 flex-1">
        <div className="h-full overflow-auto">
          <Textarea
            className="min-h-full resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
            disabled={!isCreator || isSaving}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("contentPlaceholder")}
            readOnly={!isCreator}
            value={content}
          />
        </div>
        <CopyButton
          className="absolute top-2 right-5 opacity-0 transition-opacity group-hover/textarea:opacity-100"
          content={content}
          promptId={promptId}
        />
      </div>
    </div>
  );
}
