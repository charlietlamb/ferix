"use client";

import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { AddRepositoryForm } from "@ferix/ui/forms/repositories/add-repository-form";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";

export function AddRepositoryDialog() {
  const t = useTranslations("addRepository");
  const { close } = useDialog();

  return (
    <BaseDialog
      className="overflow-visible"
      description={t("description")}
      dialogKey="addRepositoryDialog"
      size="md"
      title={t("title")}
    >
      <AddRepositoryForm onSuccess={close} />
    </BaseDialog>
  );
}
