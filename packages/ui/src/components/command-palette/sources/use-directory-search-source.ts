"use client";

import { api } from "@ferix/server/_generated/api";
import { formatTitle, getGithubAvatarUrl } from "@ferix/ui/lib/directories";
import { useQuery } from "convex/react";
import type { CommandItemData } from "../types";

interface DirectorySearchSourceResult {
  items: CommandItemData[];
  isLoading: boolean;
}

export function useDirectorySearchSource(
  query: string
): DirectorySearchSourceResult {
  const directories = useQuery(api.directories.list);

  if (directories === undefined) {
    return { items: [], isLoading: true };
  }

  const normalizedQuery = query.toLowerCase().trim();
  const validDirectories = directories.filter((dir) => dir.owner && dir.repo);
  const filteredDirectories = normalizedQuery
    ? validDirectories.filter((dir) => {
        const ownerTitle = formatTitle(dir.owner).toLowerCase();
        const matchesOwner = dir.owner.toLowerCase().includes(normalizedQuery);
        const matchesOwnerTitle = ownerTitle.includes(normalizedQuery);
        const matchesRepo = dir.repo.toLowerCase().includes(normalizedQuery);
        const matchesDirectory =
          "directory".includes(normalizedQuery) ||
          "directories".includes(normalizedQuery);
        return (
          matchesOwner || matchesOwnerTitle || matchesRepo || matchesDirectory
        );
      })
    : validDirectories;

  return {
    items: filteredDirectories.map((dir) => ({
      id: `directory-${dir._id}`,
      type: "directory" as const,
      label: formatTitle(dir.owner),
      description: `${dir.owner}/${dir.repo}`,
      imageUrl: getGithubAvatarUrl(dir.owner),
      path: `/directory/${dir._id}`,
    })),
    isLoading: false,
  };
}
