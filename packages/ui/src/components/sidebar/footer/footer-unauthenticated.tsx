"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useSidebar } from "@ferix/ui/components/ui/sidebar";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { SignInIcon } from "@phosphor-icons/react";

export function FooterUnauthenticated() {
  const { open: openDialog } = useDialog();
  const { open } = useSidebar();

  return (
    <Button
      className="w-full"
      onClick={() => openDialog("signInDialog")}
      size={open ? "default" : "icon"}
    >
      <SignInIcon className="size-4" />
      {open && "Sign in"}
    </Button>
  );
}
