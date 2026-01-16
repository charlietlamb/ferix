"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import { promptFormDefaults } from "@ferix/ui/forms/prompts/prompt-form-schema";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { usePromptDraft } from "@ferix/ui/hooks/use-prompt-draft";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AppPage } from "../../layout/app-page";
import { Textarea } from "../../ui/textarea";
import { PromptNewHeader } from "./prompt-new-header";
import { PromptNewSidebar } from "./prompt-new-sidebar";
import { PromptNewToolbar } from "./prompt-new-toolbar";

export function PromptNewPage() {
  const t = useTranslations("promptNew");
  const router = useRouter();
  const createPrompt = useMutation(api.prompts.create);

  // usePromptDraft handles localStorage persistence separately
  const { content, setContent, hasLocalChanges, clearDraft } = usePromptDraft({
    serverContent: "",
  });

  const form = useAppForm({
    defaultValues: promptFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        const result = await createPrompt({
          title: value.title.trim(),
          content: content.trim(), // Use content from usePromptDraft
          type: value.type,
          tags: value.tags,
          directoryId: value.directoryId,
        });
        clearDraft();
        toast.success(t("success"));
        router.push(`/prompt/${result.slug}`);
      } catch {
        toast.error(t("error"));
      }
    },
  });

  // Derive canCreate from form state and content
  const canCreate =
    form.state.values.title.trim() !== "" && content.trim() !== "";

  return (
    <AppPage>
      <form
        className="flex flex-1 flex-col overflow-hidden md:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="flex min-h-[400px] flex-1 flex-col md:min-h-0">
          <form.AppField name="title">
            {(titleField) => (
              <form.AppField name="type">
                {(typeField) => (
                  <PromptNewHeader
                    onTitleChange={titleField.handleChange}
                    onTypeChange={typeField.handleChange}
                    title={titleField.state.value}
                    type={typeField.state.value}
                  />
                )}
              </form.AppField>
            )}
          </form.AppField>

          <form.Subscribe
            selector={(state) => ({
              title: state.values.title,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ title, isSubmitting }) => (
              <PromptNewToolbar
                canCreate={canCreate}
                hasLocalChanges={hasLocalChanges}
                isCreating={isSubmitting}
                onCreate={() => form.handleSubmit()}
                title={title}
              />
            )}
          </form.Subscribe>

          <div className="group/textarea relative min-h-0 flex-1">
            <div className="h-full overflow-auto">
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Textarea
                    className="min-h-full resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
                    disabled={isSubmitting}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("contentPlaceholder")}
                    value={content}
                  />
                )}
              </form.Subscribe>
            </div>
          </div>
        </div>

        <form.AppField name="tags">
          {(tagsField) => (
            <form.AppField name="directoryId">
              {(directoryField) => (
                <form.Subscribe
                  selector={(state) => ({
                    isSubmitting: state.isSubmitting,
                  })}
                >
                  {({ isSubmitting }) => (
                    <PromptNewSidebar
                      canCreate={canCreate}
                      directoryId={directoryField.state.value}
                      isCreating={isSubmitting}
                      onCreate={() => form.handleSubmit()}
                      onDirectoryChange={directoryField.handleChange}
                      onTagsChange={tagsField.handleChange}
                      tags={tagsField.state.value}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.AppField>
          )}
        </form.AppField>
      </form>
    </AppPage>
  );
}
