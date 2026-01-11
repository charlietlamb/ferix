"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ferix/ui/components/ui/dialog";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import type { DialogKey } from "@ferix/ui/store/dialog";

export function BaseDialog({
  title,
  description,
  dialogKey,
  children,
}: {
  title: string;
  description: string;
  dialogKey: DialogKey;
  children: React.ReactNode;
}) {
  const { close, stack } = useDialog();
  const isOpen = stack.some((dialog) => dialog.key === dialogKey);

  return (
    <Dialog onOpenChange={close} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
