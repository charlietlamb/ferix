"use client";

import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { AddDirectoryForm } from "@ferix/ui/forms/directories/add-directory-form";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";

export function AddDirectoryDialog() {
  const t = useTranslations("addDirectory");
  const { close } = useDialog();

  return (
    <BaseDialog
      description={t("description")}
      dialogKey="addDirectoryDialog"
      size="md"
      title={t("title")}
    >
      <AddDirectoryForm onSuccess={close} />
    </BaseDialog>
  );
}
