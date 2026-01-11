"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ferix/ui/components/ui/dialog";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { cn } from "@ferix/ui/lib/utils";
import type { DialogKey } from "@ferix/ui/store/dialog";

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
} as const;

export function BaseDialog({
  title,
  description,
  dialogKey,
  children,
  size = "md",
}: {
  title: string;
  description: string;
  dialogKey: DialogKey;
  children: React.ReactNode;
  size?: keyof typeof sizeClasses;
}) {
  const { close, stack } = useDialog();
  const isOpen = stack.some((dialog) => dialog.key === dialogKey);

  return (
    <Dialog onOpenChange={close} open={isOpen}>
      <DialogContent className={cn(sizeClasses[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
