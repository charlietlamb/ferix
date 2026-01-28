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
import { useImpersonation } from "@ferix/ui/hooks/use-impersonation";
import type { DialogKey } from "@ferix/ui/store/dialog";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useCallback, useState } from "react";
import { CommandPaletteEmpty } from "./command-palette-empty";
import { useCommandPalette } from "./hooks/use-command-palette";
import { useActionsSource } from "./sources/use-actions-source";
import { usePromptsSource } from "./sources/use-prompts-source";
import { useRepositorySearchSource } from "./sources/use-repository-search-source";
import type { CommandItemData } from "./types";

const DIALOG_ACTIONS: Record<string, DialogKey> = {
  addRepositoryDialog: "addRepositoryDialog",
  impersonatePalette: "impersonatePalette",
  syncRepositoryPalette: "syncRepositoryPalette",
  deleteRepositoryPalette: "deleteRepositoryPalette",
};

const AUTH_REQUIRED_ROUTES: Record<string, string> = {
  createPromptDialog: "/create-prompt",
  settingsDialog: "/settings",
};

const NAVIGATION_ROUTES: Record<string, string> = {
  navigateHome: "/",
  navigatePopular: "/popular",
  navigateRecent: "/recent",
  navigateTags: "/tags",
  navigateRepositories: "/repositories",
};

const ADMIN_NAVIGATION_ROUTES: Record<string, string> = {
  navigateAdmin: "/admin",
  navigateFeaturedRepositories: "/admin/featured-repositories",
  navigateBulkImports: "/admin/bulk-imports",
};

const getUserRoutes = (username: string | null): Record<string, string> =>
  username
    ? {
        navigateMyProfile: `/user/${username}`,
        navigateSaved: `/user/${username}?tab=saved`,
      }
    : {};

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const router = useRouter();
  const { close, open: openDialog, stack } = useDialog();
  const { setTheme, resolvedTheme } = useTheme();
  const { isAuthenticated, user } = useAuthenticated();
  const username =
    (user as { username?: string | null } | undefined)?.username ?? null;
  const { stopImpersonating } = useImpersonation();

  const [query, setQuery] = useState("");
  const { items: promptItems, isLoading: isLoadingPrompts } =
    usePromptsSource(query);
  const { items: repositorySearchItems, isLoading: isLoadingRepositories } =
    useRepositorySearchSource(query);
  const { items: actionItems } = useActionsSource(query);
  const { groups, isEmpty } = useCommandPalette(
    promptItems,
    repositorySearchItems,
    actionItems,
    query
  );

  const isOpen = stack.some((dialog) => dialog.key === "commandPaletteDialog");

  const closeAndReset = useCallback(() => {
    close();
    setQuery("");
  }, [close]);

  const handleAction = useCallback(
    async (action: string) => {
      if (action === "toggleTheme") {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return true;
      }

      if (action === "stopImpersonating") {
        await stopImpersonating();
        return true;
      }

      if (action in DIALOG_ACTIONS) {
        openDialog(DIALOG_ACTIONS[action] as "impersonatePalette");
        return true;
      }

      const authRoute = AUTH_REQUIRED_ROUTES[action];
      if (authRoute) {
        if (isAuthenticated) {
          router.push(authRoute);
        } else {
          openDialog("signInDialog");
        }
        return true;
      }

      const navRoute =
        NAVIGATION_ROUTES[action] ||
        ADMIN_NAVIGATION_ROUTES[action] ||
        getUserRoutes(username)[action];
      if (navRoute) {
        router.push(navRoute);
        return true;
      }

      return false;
    },
    [
      isAuthenticated,
      openDialog,
      resolvedTheme,
      router,
      setTheme,
      stopImpersonating,
      username,
    ]
  );

  const handleSelect = useCallback(
    async (item: CommandItemData) => {
      closeAndReset();
      const { action, path } = item;

      if (action) {
        const handled = await handleAction(action);
        if (handled) {
          return;
        }
      }

      if (path) {
        router.push(path);
      }
    },
    [closeAndReset, handleAction, router]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeAndReset();
      }
    },
    [closeAndReset]
  );

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
