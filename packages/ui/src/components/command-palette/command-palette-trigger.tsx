"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function CommandPaletteTrigger() {
  const t = useTranslations("commandPalette");
  const { open } = useDialog();

  return (
    <Button
      className="h-8 w-full justify-start gap-2 px-2 text-muted-foreground"
      onClick={() => open("commandPaletteDialog")}
      variant="outline"
    >
      <MagnifyingGlassIcon className="size-4" />
      <span className="flex-1 text-left text-sm">{t("placeholder")}</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
