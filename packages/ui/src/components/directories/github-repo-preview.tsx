"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import type { GithubRepoData } from "@ferix/ui/hooks/use-github-repo-validation";
import { CheckCircleIcon, StarIcon } from "@phosphor-icons/react";

interface GithubRepoPreviewProps {
  repo: GithubRepoData;
}

export function GithubRepoPreview({ repo }: GithubRepoPreviewProps) {
  return (
    <div className="flex items-start gap-3 border border-border bg-muted/30 p-4">
      <Avatar className="rounded-none after:rounded-none" size="lg">
        <AvatarImage
          alt={repo.fullName}
          className="rounded-none"
          src={repo.avatarUrl}
        />
        <AvatarFallback>{repo.fullName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">{repo.fullName}</span>
          <CheckCircleIcon
            className="size-4 shrink-0 text-green-500"
            weight="fill"
          />
        </div>
        {repo.description && (
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {repo.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <StarIcon className="size-3" weight="fill" />
          <span>{repo.stars.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
