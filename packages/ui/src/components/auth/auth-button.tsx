"use client";

import { Button, type buttonVariants } from "@ferix/ui/components/ui/button";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import type { VariantProps } from "class-variance-authority";

interface AuthButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  onAuthenticatedClick?: () => void;
}

export function AuthButton({
  children,
  onAuthenticatedClick,
  onClick,
  ...props
}: AuthButtonProps) {
  const { isAuthenticated } = useAuthenticated();
  const { open: openDialog } = useDialog();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isAuthenticated) {
      onAuthenticatedClick?.();
      onClick?.(e);
    } else {
      openDialog("signInDialog");
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}
