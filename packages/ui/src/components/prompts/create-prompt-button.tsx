"use client";

import { AuthButton } from "@ferix/ui/components/auth/auth-button";
import type { buttonVariants } from "@ferix/ui/components/ui/button";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { PlusIcon } from "@phosphor-icons/react";
import type { VariantProps } from "class-variance-authority";

interface CreatePromptButtonProps extends VariantProps<typeof buttonVariants> {
  className?: string;
  children?: React.ReactNode;
}

export function CreatePromptButton({
  variant = "ghost",
  size = "default",
  className,
  children,
}: CreatePromptButtonProps) {
  const { open: openDialog } = useDialog();

  return (
    <AuthButton
      className={className}
      onAuthenticatedClick={() => openDialog("createPromptDialog")}
      size={size}
      variant={variant}
    >
      <PlusIcon className="size-4" />
      {children}
    </AuthButton>
  );
}
