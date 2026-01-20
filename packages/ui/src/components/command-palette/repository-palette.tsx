"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ferix/ui/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ferix/ui/components/ui/dialog";
import { Spinner } from "@ferix/ui/components/ui/spinner";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { getGithubAvatarUrl } from "@ferix/ui/lib/repositories";
import { useMutation, usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type Mode = "sync" | "delete";

interface RepositoryPaletteProps {
  mode: Mode;
}

export function RepositoryPalette({ mode }: RepositoryPaletteProps) {
  const t = useTranslations("commandPalette");
  const tRepository = useTranslations("pages.repository");
  const { close, open, stack } = useDialog();
  const [search, setSearch] = useState("");

  const triggerSync = useMutation(api.directories.triggerSync);
  const removeRepository = useMutation(api.directories.remove);

  const { results, status } = usePaginatedQuery(
    api.directories.list,
    { orderBy: "popular" },
    { initialNumItems: 50 }
  );

  const dialogKey =
    mode === "sync" ? "syncRepositoryPalette" : "deleteRepositoryPalette";
  const isOpen = stack.some((d) => d.key === dialogKey);

  const filteredResults = search
    ? results.filter(
        (repo) =>
          repo.owner?.toLowerCase().includes(search.toLowerCase()) ||
          repo.repo?.toLowerCase().includes(search.toLowerCase())
      )
    : results;

  const handleSync = async (id: string) => {
    close();
    setSearch("");
    try {
      await triggerSync({ directoryId: id as Id<"directories"> });
      toast.success(tRepository("syncStarted"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        tRepository(
          message.includes("already in progress")
            ? "syncInProgress"
            : "syncError"
        )
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    close();
    setSearch("");
    open("confirmDialog", {
      title: tRepository("deleteTitle"),
      description: tRepository("deleteDescription", { name }),
      confirmLabel: tRepository("deleteConfirm"),
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await removeRepository({
            directoryId: id as Id<"directories">,
          });
          toast.success(
            tRepository("deleteSuccess", { count: result?.deletedPrompts ?? 0 })
          );
        } catch {
          toast.error(tRepository("deleteError"));
        }
      },
    });
  };

  const handleSelect = (repo: (typeof results)[number]) => {
    if (mode === "sync") {
      handleSync(repo._id);
    } else {
      handleDelete(repo._id, `${repo.owner}/${repo.repo}`);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setSearch("");
    }
  };

  const title =
    mode === "sync" ? t("syncRepositoryTitle") : t("deleteRepositoryTitle");
  const description =
    mode === "sync"
      ? t("syncRepositoryDescription")
      : t("deleteRepositoryDescription");

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <Command className="border-0" shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder={t("repositoryPlaceholder")}
            value={search}
          />
          <CommandList>
            {status === "LoadingFirstPage" && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                <Spinner />
                <span>{t("loading")}</span>
              </div>
            )}
            {status !== "LoadingFirstPage" && filteredResults.length === 0 && (
              <CommandEmpty>{t("noRepositories")}</CommandEmpty>
            )}
            {filteredResults.length > 0 && (
              <CommandGroup heading={t("repositorySearch")}>
                {filteredResults.slice(0, 20).map((repo) => (
                  <CommandItem
                    key={repo._id}
                    onSelect={() => handleSelect(repo)}
                    value={repo._id}
                  >
                    <img
                      alt={repo.owner}
                      className="size-5 shrink-0 rounded border border-border"
                      height={20}
                      src={getGithubAvatarUrl(repo.owner)}
                      width={20}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">
                        {repo.name || repo.repo}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {repo.owner}/{repo.repo}
                      </span>
                    </div>
                    {mode === "sync" && repo.syncStatus === "syncing" && (
                      <span className="shrink-0 text-muted-foreground text-xs">
                        Syncing...
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function SyncRepositoryPalette() {
  return <RepositoryPalette mode="sync" />;
}

export function DeleteRepositoryPalette() {
  return <RepositoryPalette mode="delete" />;
}
