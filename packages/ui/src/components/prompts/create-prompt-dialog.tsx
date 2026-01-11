"use client";

import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { CreatePromptForm } from "@ferix/ui/forms/prompts/create-prompt-form";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";

export function CreatePromptDialog() {
  const t = useTranslations("prompts.create");
  const { close } = useDialog();

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="createPromptDialog"
      size="lg"
      title={t("title")}
    >
      <CreatePromptForm onSuccess={close} />
    </BaseDialog>
  );
}
