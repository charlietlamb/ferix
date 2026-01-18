"use client";

import { api } from "@ferix/server/_generated/api";
import {
  formatTitle,
  getGithubAvatarUrl,
  getRepositoryDisplayName,
} from "@ferix/ui/lib/repositories";
import { useQuery } from "convex/react";
import type { CommandItemData } from "../types";

interface RepositorySearchSourceResult {
  items: CommandItemData[];
  isLoading: boolean;
}

export function useRepositorySearchSource(
  query: string
): RepositorySearchSourceResult {
  const repositories = useQuery(api.directories.list);

  if (repositories === undefined) {
    return { items: [], isLoading: true };
  }

  const normalizedQuery = query.toLowerCase().trim();
  const validRepositories = repositories.filter(
    (repo) => repo.owner && repo.repo
  );
  const filteredRepositories = normalizedQuery
    ? validRepositories.filter((repo) => {
        const displayName = getRepositoryDisplayName(repo).toLowerCase();
        const ownerTitle = formatTitle(repo.owner).toLowerCase();
        const matchesName = displayName.includes(normalizedQuery);
        const matchesOwner = repo.owner.toLowerCase().includes(normalizedQuery);
        const matchesOwnerTitle = ownerTitle.includes(normalizedQuery);
        const matchesRepo = repo.repo.toLowerCase().includes(normalizedQuery);
        const matchesRepository =
          "repository".includes(normalizedQuery) ||
          "repositories".includes(normalizedQuery);
        return (
          matchesName ||
          matchesOwner ||
          matchesOwnerTitle ||
          matchesRepo ||
          matchesRepository
        );
      })
    : validRepositories;

  return {
    items: filteredRepositories.map((repo) => ({
      id: `repository-${repo._id}`,
      type: "repository" as const,
      label: getRepositoryDisplayName(repo),
      description: `${repo.owner}/${repo.repo}`,
      imageUrl: getGithubAvatarUrl(repo.owner),
      path: `/repository/${repo.owner}/${repo.repo}`,
    })),
    isLoading: false,
  };
}
