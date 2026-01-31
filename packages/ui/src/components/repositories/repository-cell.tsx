"use client";

import { Link } from "@ferix/i18n/navigation";
import { AnimatedSkeleton } from "@ferix/ui/components/ui/animated-skeleton";
import {
  getGithubAvatarUrl,
  getRepositoryDisplayName,
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
  const displayName = getRepositoryDisplayName(repository);

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
        <span className="truncate font-medium text-sm">{displayName}</span>
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
 * Skeleton version of RepositoryCell for loading states.
 * Uses AnimatedSkeleton with staggered shimmer effect for smooth loading.
 */
export function RepositoryCellSkeleton({
  showAvatar = true,
  heightClass = "h-16",
  /** Base delay for staggered animations in grid contexts */
  delay = 0,
}: {
  showAvatar?: boolean;
  heightClass?: string;
  delay?: number;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4", heightClass)}>
      {showAvatar ? (
        <AnimatedSkeleton className="size-10 rounded-sm" delay={delay} />
      ) : (
        <AnimatedSkeleton className="size-5" delay={delay} variant="icon" />
      )}
      <div className="flex flex-col gap-1">
        <AnimatedSkeleton
          className="h-4 w-24"
          delay={delay + 0.05}
          variant="text"
        />
        <AnimatedSkeleton
          className="h-3 w-32"
          delay={delay + 0.1}
          variant="text"
        />
      </div>
    </div>
  );
}
