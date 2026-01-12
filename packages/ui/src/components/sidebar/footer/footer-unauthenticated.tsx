"use client";

import { ThemeToggle } from "@ferix/ui/components/theme/theme-toggle";
import { Button } from "@ferix/ui/components/ui/button";
import { useSidebar } from "@ferix/ui/components/ui/sidebar";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { SignInIcon } from "@phosphor-icons/react";

export function FooterUnauthenticated() {
  const { open: openDialog } = useDialog();
  const { open } = useSidebar();

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        onClick={() => openDialog("signInDialog")}
        size={open ? "sm" : "icon-sm"}
        variant="secondary"
      >
        <SignInIcon className="size-4" />
        {open && "Log in"}
      </Button>
      {open && <ThemeToggle />}
    </div>
  );
}
