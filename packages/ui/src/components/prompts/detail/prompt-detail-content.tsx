"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptDetailHeader } from "@ferix/ui/components/prompts/detail/prompt-detail-header";
import { PromptDetailToolbar } from "@ferix/ui/components/prompts/detail/prompt-detail-toolbar";
import { Textarea } from "@ferix/ui/components/ui/textarea";
import { CopyButton } from "@ferix/ui/components/utils/copy-button";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { usePromptDraft } from "@ferix/ui/hooks/use-prompt-draft";
import type { PromptType } from "@ferix/ui/lib/prompt-types";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PromptDetailContentProps {
  promptId: Id<"prompts">;
  serverContent: string;
  canEdit: boolean;
  title: string;
  slug: string;
  type: PromptType;
}

export function PromptDetailContent({
  promptId,
  serverContent,
  canEdit,
  title,
  slug,
  type,
}: PromptDetailContentProps) {
  const t = useTranslations("promptDetail");
  const updatePrompt = useMutation(api.prompts.update);

  // usePromptDraft handles localStorage persistence
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

  // TanStack Form for submit handling
  const form = useAppForm({
    defaultValues: { content: serverContent },
    onSubmit: async () => {
      try {
        await updatePrompt({ promptId, content });
        clearDraft();
        toast.success(t("saveSuccess"));
      } catch {
        toast.error(t("saveError"));
      }
    },
  });

  return (
    <div className="flex min-h-[400px] flex-1 flex-col md:min-h-0">
      <PromptDetailHeader
        content={content}
        promptId={promptId}
        slug={slug}
        title={title}
        type={type}
      />

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSaving) => (
          <>
            <PromptDetailToolbar
              canEdit={canEdit}
              hasLocalChanges={hasLocalChanges}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              onSave={() => form.handleSubmit()}
              slug={slug}
            />

            <div className="group/textarea relative min-h-0 flex-1 overflow-auto">
              <Textarea
                className="min-h-full resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
                disabled={!canEdit || isSaving}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("contentPlaceholder")}
                readOnly={!canEdit}
                value={content}
              />
              <CopyButton
                className="absolute top-2 right-5 opacity-0 transition-opacity group-hover/textarea:opacity-100"
                content={content}
                promptId={promptId}
              />
            </div>
          </>
        )}
      </form.Subscribe>
    </div>
  );
}
