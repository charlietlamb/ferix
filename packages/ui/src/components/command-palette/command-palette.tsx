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
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";
import { CommandPaletteEmpty } from "./command-palette-empty";
import { useCommandPalette } from "./hooks/use-command-palette";
import { usePromptsSource } from "./sources/use-prompts-source";
import type { CommandItemData } from "./types";

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const router = useRouter();
  const { close, open: openDialog, stack } = useDialog();
  const { setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuthenticated();

  const [query, setQuery] = useState("");
  const { items: promptItems, isLoading: isLoadingPrompts } =
    usePromptsSource(query);
  const { groups, isEmpty } = useCommandPalette(promptItems, query);

  const isOpen = stack.some((dialog) => dialog.key === "commandPaletteDialog");

  const closeAndReset = () => {
    close();
    setQuery("");
  };

  const handleSelect = (item: CommandItemData) => {
    closeAndReset();

    if (item.action === "toggleTheme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else if (item.action === "createPromptDialog") {
      if (isAuthenticated) {
        openDialog("createPromptDialog");
      } else {
        openDialog("signInDialog");
      }
    } else if (item.action === "settingsDialog") {
      openDialog("settingsDialog");
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAndReset();
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
            {isEmpty && !isLoadingPrompts ? (
              <CommandPaletteEmpty query={query} />
            ) : (
              <>
                {groups.map((group, groupIndex) => (
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
                ))}
                {isLoadingPrompts && (
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                    <Spinner />
                    <span>{t("loading")}</span>
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
