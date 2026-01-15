"use client";

import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function SearchSection() {
  const t = useTranslations("search");
  const { open } = useDialog();

  return (
    <section className="border-border border-b">
      <button
        className="flex h-14 w-full items-center gap-3 px-6 text-muted-foreground transition-colors hover:bg-muted/50"
        onClick={() => open("commandPaletteDialog")}
        type="button"
      >
        <MagnifyingGlassIcon className="size-5" />
        <span className="flex-1 text-left text-sm">{t("placeholder")}</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    </section>
  );
}
