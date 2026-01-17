"use client";

import { api } from "@ferix/server/_generated/api";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import type { CommandItemData } from "../types";

interface DirectoriesSourceResult {
  items: CommandItemData[];
  isLoading: boolean;
}

export function useDirectoriesSource(query: string): DirectoriesSourceResult {
  const { isAdmin } = useAuthenticated();
  const directories = useQuery(api.directories.list, isAdmin ? {} : "skip");

  if (!isAdmin) {
    return { items: [], isLoading: false };
  }

  if (directories === undefined) {
    return { items: [], isLoading: true };
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Filter out directories without owner/repo (legacy data) and filter by query
  const validDirectories = directories.filter((dir) => dir.owner && dir.repo);

  const filteredDirectories = normalizedQuery
    ? validDirectories.filter((dir) => {
        const matchesOwner = dir.owner.toLowerCase().includes(normalizedQuery);
        const matchesRepo = dir.repo.toLowerCase().includes(normalizedQuery);
        const matchesSync = "sync".includes(normalizedQuery);
        return matchesOwner || matchesRepo || matchesSync;
      })
    : validDirectories;

  return {
    items: filteredDirectories.map((dir) => ({
      id: `sync-directory-${dir._id}`,
      type: "directory" as const,
      label: `Sync ${dir.owner}/${dir.repo}`,
      description: dir.syncStatus === "syncing" ? "Syncing..." : undefined,
      icon: ArrowsClockwiseIcon,
      action: `syncDirectory:${dir._id}`,
    })),
    isLoading: false,
  };
}
