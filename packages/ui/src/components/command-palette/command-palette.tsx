"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
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
import { useImpersonation } from "@ferix/ui/hooks/use-impersonation";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CommandPaletteEmpty } from "./command-palette-empty";
import { useCommandPalette } from "./hooks/use-command-palette";
import { useActionsSource } from "./sources/use-actions-source";
import { usePromptsSource } from "./sources/use-prompts-source";
import { useRepositoriesSource } from "./sources/use-repositories-source";
import { useRepositorySearchSource } from "./sources/use-repository-search-source";
import type { CommandItemData } from "./types";

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const tRepository = useTranslations("pages.repository");
  const router = useRouter();
  const { close, open: openDialog, stack } = useDialog();
  const { setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuthenticated();
  const { stopImpersonating } = useImpersonation();
  const triggerSync = useMutation(api.directories.triggerSync);
  const removeRepository = useMutation(api.directories.remove);

  const [query, setQuery] = useState("");
  const { items: promptItems, isLoading: isLoadingPrompts } =
    usePromptsSource(query);
  const { items: syncRepositoryItems, isLoading: isLoadingSyncRepositories } =
    useRepositoriesSource(query);
  const { items: repositorySearchItems, isLoading: isLoadingRepositorySearch } =
    useRepositorySearchSource(query);
  const { items: actionItems } = useActionsSource(query);
  const { groups, isEmpty } = useCommandPalette(
    promptItems,
    syncRepositoryItems,
    repositorySearchItems,
    actionItems,
    query
  );

  const isLoadingRepositories =
    isLoadingSyncRepositories || isLoadingRepositorySearch;

  const isOpen = stack.some((dialog) => dialog.key === "commandPaletteDialog");

  const handleSyncRepository = async (repositoryId: string) => {
    try {
      await triggerSync({ directoryId: repositoryId as Id<"directories"> });
      toast.success(tRepository("syncStarted"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const errorKey = message.includes("already in progress")
        ? "syncInProgress"
        : "syncError";
      toast.error(tRepository(errorKey));
    }
  };

  const handleDeleteRepository = useCallback(
    async (repositoryId: string) => {
      try {
        const result = await removeRepository({
          directoryId: repositoryId as Id<"directories">,
        });
        toast.success(
          tRepository("deleteSuccess", { count: result?.deletedPrompts ?? 0 })
        );
      } catch {
        toast.error(tRepository("deleteError"));
      }
    },
    [removeRepository, tRepository]
  );

  const closeAndReset = () => {
    close();
    setQuery("");
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: refactor later
  const handleSelect = async (item: CommandItemData) => {
    closeAndReset();

    const { action, path } = item;

    if (action === "toggleTheme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else if (action === "createPromptDialog") {
      isAuthenticated
        ? router.push("/create-prompt")
        : openDialog("signInDialog");
    } else if (action === "settingsDialog") {
      isAuthenticated ? router.push("/settings") : openDialog("signInDialog");
    } else if (action === "addRepositoryDialog") {
      isAuthenticated
        ? openDialog("addRepositoryDialog")
        : openDialog("signInDialog");
    } else if (action === "impersonatePalette") {
      openDialog("impersonatePalette");
    } else if (action === "stopImpersonating") {
      await stopImpersonating();
    } else if (action?.startsWith("syncRepository:")) {
      await handleSyncRepository(action.replace("syncRepository:", ""));
    } else if (action?.startsWith("deleteRepository:")) {
      const [, repositoryId = "", repositoryName = ""] = action.split(":");
      openDialog("confirmDialog", {
        title: tRepository("deleteTitle"),
        description: tRepository("deleteDescription", { name: repositoryName }),
        confirmLabel: tRepository("deleteConfirm"),
        variant: "destructive",
        onConfirm: () => handleDeleteRepository(repositoryId),
      });
    } else if (path) {
      router.push(path);
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
            {isEmpty && !isLoadingPrompts && !isLoadingRepositories ? (
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
                            {item.imageUrl ? (
                              <img
                                alt={item.label}
                                className="size-4 shrink-0 border border-border"
                                height={16}
                                src={item.imageUrl}
                                width={16}
                              />
                            ) : (
                              Icon && <Icon className="size-4 shrink-0" />
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {item.labelKey ? t(item.labelKey) : item.label}
                            </span>
                            {item.description && (
                              <span className="shrink-0 text-muted-foreground text-xs">
                                {item.description}
                              </span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </div>
                ))}
                {(isLoadingPrompts || isLoadingRepositories) && (
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
