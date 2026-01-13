"use client";

import { BaseDialog } from "@ferix/ui/components/dialog/base-dialog";
import { Button } from "@ferix/ui/components/ui/button";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  variant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("ui");
  const { close } = useDialog();

  const handleConfirm = async () => {
    await onConfirm();
    close();
  };

  return (
    <BaseDialog
      description={description}
      dialogKey="confirmDialog"
      size="sm"
      title={title}
    >
      <div className="flex justify-end gap-2">
        <Button onClick={close} variant="outline">
          {t("cancel")}
        </Button>
        <Button onClick={handleConfirm} variant={variant}>
          {confirmLabel}
        </Button>
      </div>
    </BaseDialog>
  );
}
