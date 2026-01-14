"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PromptNewHeader } from "@ferix/ui/components/prompts/new/prompt-new-header";
import { PromptNewSidebar } from "@ferix/ui/components/prompts/new/prompt-new-sidebar";
import { PromptNewToolbar } from "@ferix/ui/components/prompts/new/prompt-new-toolbar";
import { Textarea } from "@ferix/ui/components/ui/textarea";
import { usePromptDraft } from "@ferix/ui/hooks/use-prompt-draft";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function PromptNewPage() {
  const t = useTranslations("promptNew");
  const router = useRouter();
  const createPrompt = useMutation(api.prompts.create);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { content, setContent, hasLocalChanges, clearDraft } = usePromptDraft({
    serverContent: "",
  });

  const canCreate = title.trim() !== "" && content.trim() !== "";

  const handleCreate = async () => {
    if (!canCreate) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPrompt({
        title: title.trim(),
        content: content.trim(),
        type: "subagent",
        tags,
      });
      clearDraft();
      toast.success(t("success"));
      router.push(`/prompt/${result.slug}`);
    } catch {
      toast.error(t("error"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppPage>
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-[400px] flex-1 flex-col md:min-h-0">
          <PromptNewHeader onTitleChange={setTitle} title={title} />

          <PromptNewToolbar
            canCreate={canCreate}
            hasLocalChanges={hasLocalChanges}
            isCreating={isCreating}
            onCreate={handleCreate}
            title={title}
          />

          <div className="group/textarea relative min-h-0 flex-1">
            <div className="h-full overflow-auto">
              <Textarea
                className="min-h-full resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
                disabled={isCreating}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("contentPlaceholder")}
                value={content}
              />
            </div>
          </div>
        </div>

        <PromptNewSidebar
          canCreate={canCreate}
          isCreating={isCreating}
          onCreate={handleCreate}
          onTagsChange={setTags}
          tags={tags}
        />
      </div>
    </AppPage>
  );
}
