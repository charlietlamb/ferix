"use client";

import { Link } from "@ferix/i18n/navigation";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";
import {
  type DirectoryBase,
  formatTitle,
  getGithubAvatarUrl,
} from "@ferix/ui/lib/directories";
import { cn } from "@ferix/ui/lib/utils";
import { FolderIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface DirectoryCellProps {
  directory: DirectoryBase;
  /** Optional prompt count to display */
  count?: number;
  /** Show GitHub avatar instead of folder icon */
  showAvatar?: boolean;
  /** Cell height class */
  heightClass?: string;
}

export function DirectoryCell({
  directory,
  count,
  showAvatar = true,
  heightClass = "h-16",
}: DirectoryCellProps) {
  const t = useTranslations("directories");
  const ownerTitle = formatTitle(directory.owner);

  return (
    <Link
      className={cn(
        "flex items-center gap-3 px-4 transition-colors hover:bg-muted/50",
        heightClass
      )}
      href={`/directory/${directory._id}`}
    >
      {showAvatar ? (
        <img
          alt={directory.owner}
          className="size-10 border border-border"
          height={48}
          src={getGithubAvatarUrl(directory.owner)}
          width={48}
        />
      ) : (
        <FolderIcon size={20} />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-sm">{ownerTitle}</span>
        <span className="truncate text-muted-foreground text-xs">
          {directory.owner}/{directory.repo}
        </span>
        {count !== undefined && (
          <span className="text-muted-foreground text-xs">
            {t("promptCount", { count })}
          </span>
        )}
      </div>
      {directory.syncStatus === "syncing" && (
        <span className="ml-auto text-muted-foreground text-xs">
          Syncing...
        </span>
      )}
    </Link>
  );
}

/**
 * Skeleton version of DirectoryCell for loading states
 */
export function DirectoryCellSkeleton({
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
