"use client";

import { CommandEmpty } from "@ferix/ui/components/ui/command";
import { useTranslations } from "next-intl";

interface CommandPaletteEmptyProps {
  query: string;
}

export function CommandPaletteEmpty({ query }: CommandPaletteEmptyProps) {
  const t = useTranslations("commandPalette");

  return (
    <CommandEmpty className="flex flex-col gap-1 py-6 text-center">
      <p className="text-sm">{t("noResults")}</p>
      {query && (
        <p className="text-muted-foreground text-xs">{t("noResultsHint")}</p>
      )}
    </CommandEmpty>
  );
}
