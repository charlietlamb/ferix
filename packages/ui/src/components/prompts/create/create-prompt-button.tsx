"use client";

import { Button, type buttonVariants } from "@ferix/ui/components/ui/button";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
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
  const { isAuthenticated } = useAuthenticated();
  const { open: openDialog } = useDialog();

  const handleClick = () => {
    if (isAuthenticated) {
      openDialog("createMenuDialog");
    } else {
      openDialog("signInDialog");
    }
  };

  return (
    <Button
      className={className}
      onClick={handleClick}
      size={size}
      variant={variant}
    >
      <PlusIcon className="size-4" />
      {children}
    </Button>
  );
}
