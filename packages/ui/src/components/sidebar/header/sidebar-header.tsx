"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { SidebarHeader, useSidebar } from "@ferix/ui/components/ui/sidebar";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { FlaskIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Logo } from "../../brand/logo";

export function SidebarHeaderContent() {
  const { user } = useAuthenticated();
  const { open: openDialog } = useDialog();
  const { open } = useSidebar();
  const t = useTranslations("prompts");

  if (!user) {
    return null;
  }

  return (
    <SidebarHeader className="flex flex-row items-center justify-between gap-2">
      {open && <Logo />}
      <Button
        onClick={() => openDialog("createPromptDialog")}
        size={open ? "default" : "icon"}
        variant="outline"
      >
        {open && t("newPrompt")}
        <FlaskIcon className="size-4" />
      </Button>
    </SidebarHeader>
  );
}
