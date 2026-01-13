"use client";

import { useRouter } from "@ferix/i18n/navigation";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@ferix/ui/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ferix/ui/components/ui/dialog";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { CommandPaletteEmpty } from "./command-palette-empty";
import { useCommandPalette } from "./hooks/use-command-palette";
import type { CommandItemData } from "./types";

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const router = useRouter();
  const { close, stack } = useDialog();
  const { open: openDialog } = useDialog();
  const { setTheme, resolvedTheme } = useTheme();
  const { query, setQuery, groups, isEmpty, resetQuery } = useCommandPalette();

  const isOpen = stack.some((dialog) => dialog.key === "commandPaletteDialog");

  const handleSelect = (item: CommandItemData) => {
    if (item.action === "toggleTheme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      close();
      resetQuery();
      return;
    }

    if (item.action === "createPromptDialog") {
      close();
      resetQuery();
      openDialog("createPromptDialog");
      return;
    }

    if (item.action === "settingsDialog") {
      close();
      resetQuery();
      openDialog("settingsDialog");
      return;
    }

    if (item.path) {
      close();
      resetQuery();
      router.push(item.path);
      return;
    }

    close();
    resetQuery();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      resetQuery();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <Command className="border-0" shouldFilter={false}>
          <CommandInput
            onValueChange={setQuery}
            placeholder={t("placeholder")}
            value={query}
          />
          <CommandList>
            {isEmpty ? (
              <CommandPaletteEmpty query={query} />
            ) : (
              groups.map((group, groupIndex) => (
                <div key={group.id}>
                  {groupIndex > 0 && <CommandSeparator />}
                  <CommandGroup heading={t(group.id)}>
                    {group.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleSelect(item)}
                          value={item.id}
                        >
                          {Icon && <Icon className="size-4" />}
                          <span className="flex-1">{item.label}</span>
                          {item.description && (
                            <span className="text-muted-foreground text-xs">
                              {item.description}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </div>
              ))
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
