"use client";

import { api } from "@ferix/server/_generated/api";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { getGithubAvatarUrl } from "@ferix/ui/lib/repositories";
import { ArrowsClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import type { CommandItemData } from "../types";

interface RepositoriesSourceResult {
  items: CommandItemData[];
  isLoading: boolean;
}

export function useRepositoriesSource(query: string): RepositoriesSourceResult {
  const { isAdmin } = useAuthenticated();
  const repositories = useQuery(api.directories.list, isAdmin ? {} : "skip");

  if (!isAdmin) {
    return { items: [], isLoading: false };
  }

  if (repositories === undefined) {
    return { items: [], isLoading: true };
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Filter out repositories without owner/repo (legacy data) and filter by query
  const validRepositories = repositories.filter(
    (repo) => repo.owner && repo.repo
  );

  const filteredRepositories = normalizedQuery
    ? validRepositories.filter((repo) => {
        const matchesOwner = repo.owner.toLowerCase().includes(normalizedQuery);
        const matchesRepo = repo.repo.toLowerCase().includes(normalizedQuery);
        const matchesSync = "sync".includes(normalizedQuery);
        const matchesDelete = "delete".includes(normalizedQuery);
        return matchesOwner || matchesRepo || matchesSync || matchesDelete;
      })
    : validRepositories;

  const items: CommandItemData[] = [];

  for (const repo of filteredRepositories) {
    const avatarUrl = getGithubAvatarUrl(repo.owner);

    // Sync action
    items.push({
      id: `sync-repository-${repo._id}`,
      type: "repository" as const,
      label: `Sync ${repo.owner}/${repo.repo}`,
      description: repo.syncStatus === "syncing" ? "Syncing..." : undefined,
      icon: ArrowsClockwiseIcon,
      imageUrl: avatarUrl,
      action: `syncRepository:${repo._id}`,
    });

    // Delete action
    items.push({
      id: `delete-repository-${repo._id}`,
      type: "repository" as const,
      label: `Delete ${repo.owner}/${repo.repo}`,
      icon: TrashIcon,
      imageUrl: avatarUrl,
      action: `deleteRepository:${repo._id}:${repo.owner}/${repo.repo}`,
    });
  }

  return { items, isLoading: false };
}
