"use client";

import { api } from "@ferix/server/_generated/api";
import { useAppForm } from "@ferix/ui/hooks/use-app-form";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createPromptFormDefaults,
  createPromptFormSchema,
} from "./create-prompt-form-schema";

interface CreatePromptFormProps {
  onSuccess?: () => void;
}

export function CreatePromptForm({ onSuccess }: CreatePromptFormProps) {
  const t = useTranslations("prompts.create");
  const createPrompt = useMutation(api.prompts.create);

  const form = useAppForm({
    defaultValues: createPromptFormDefaults,
    validators: { onChange: createPromptFormSchema },
    onSubmit: async ({ value }) => {
      try {
        await createPrompt({
          title: value.title,
          content: value.content,
          type: "subagent",
        });
        toast.success(t("success"));
        onSuccess?.();
      } catch {
        toast.error(t("error"));
      }
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="title">
        {(field) => (
          <field.TextField
            label={t("titleLabel")}
            placeholder={t("titlePlaceholder")}
          />
        )}
      </form.AppField>
      <form.AppField name="content">
        {(field) => (
          <field.TextAreaField
            label={t("contentLabel")}
            placeholder={t("contentPlaceholder")}
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("submit")} />
      </form.AppForm>
    </form>
  );
}
