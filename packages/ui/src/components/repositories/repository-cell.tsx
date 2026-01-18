"use client";

import { Link } from "@ferix/i18n/navigation";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";
import {
  formatTitle,
  getGithubAvatarUrl,
  type RepositoryBase,
} from "@ferix/ui/lib/repositories";
import { cn } from "@ferix/ui/lib/utils";
import { FolderIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface RepositoryCellProps {
  repository: RepositoryBase;
  /** Optional prompt count to display */
  count?: number;
  /** Show GitHub avatar instead of folder icon */
  showAvatar?: boolean;
  /** Cell height class */
  heightClass?: string;
}

export function RepositoryCell({
  repository,
  count,
  showAvatar = true,
  heightClass = "h-16",
}: RepositoryCellProps) {
  const t = useTranslations("repositories");
  const ownerTitle = formatTitle(repository.owner);

  return (
    <Link
      className={cn(
        "flex items-center gap-3 px-4 transition-colors hover:bg-muted/50",
        heightClass
      )}
      href={`/repository/${repository.owner}/${repository.repo}`}
    >
      {showAvatar ? (
        <img
          alt={repository.owner}
          className="size-10 border border-border"
          height={48}
          src={getGithubAvatarUrl(repository.owner)}
          width={48}
        />
      ) : (
        <FolderIcon size={20} />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-sm">{ownerTitle}</span>
        <span className="truncate text-muted-foreground text-xs">
          {repository.owner}/{repository.repo}
        </span>
        {count !== undefined && (
          <span className="text-muted-foreground text-xs">
            {t("promptCount", { count })}
          </span>
        )}
      </div>
      {repository.syncStatus === "syncing" && (
        <span className="ml-auto text-muted-foreground text-xs">
          Syncing...
        </span>
      )}
    </Link>
  );
}

/**
 * Skeleton version of RepositoryCell for loading states
 */
export function RepositoryCellSkeleton({
  showAvatar = true,
  heightClass = "h-16",
}: {
  showAvatar?: boolean;
  heightClass?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4", heightClass)}>
      {showAvatar ? (
        <Skeleton className="size-10 rounded-sm" />
      ) : (
        <Skeleton className="size-5 rounded" />
      )}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
