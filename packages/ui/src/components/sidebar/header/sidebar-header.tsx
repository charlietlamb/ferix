"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { SidebarHeader } from "@ferix/ui/components/ui/sidebar";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { PlusIcon } from "@phosphor-icons/react";
import { Logo } from "../../brand/logo";

export function SidebarHeaderContent() {
  const { open: openDialog } = useDialog();

  return (
    <SidebarHeader className="flex flex-row items-center justify-between gap-2">
      <Logo showText />
      <Button
        onClick={() => openDialog("createPromptDialog")}
        size="default"
        variant="ghost"
      >
        <PlusIcon className="size-4" />
      </Button>
    </SidebarHeader>
  );
}
