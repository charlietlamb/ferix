"use client";

import { CreatePromptButton } from "@ferix/ui/components/prompts/create/create-prompt-button";
import { SidebarHeader } from "@ferix/ui/components/ui/sidebar";
import { Logo } from "../../brand/logo";

export function SidebarHeaderContent() {
  return (
    <SidebarHeader className="flex flex-row items-center justify-between gap-2">
      <Logo showText />
      <CreatePromptButton />
    </SidebarHeader>
  );
}
