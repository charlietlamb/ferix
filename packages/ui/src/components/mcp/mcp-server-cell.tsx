"use client";

import { Link } from "@ferix/i18n/navigation";
import { AnimatedSkeleton } from "@ferix/ui/components/ui/animated-skeleton";
import { Badge } from "@ferix/ui/components/ui/badge";
import {
  formatStars,
  getMcpDisplayName,
  getPrimaryPackageType,
  type McpServerBase,
} from "@ferix/ui/lib/mcp";
import { cn } from "@ferix/ui/lib/utils";
import { CubeIcon, StarIcon } from "@phosphor-icons/react";

interface McpServerCellProps {
  server: McpServerBase;
  heightClass?: string;
}

export function McpServerCell({
  server,
  heightClass = "h-24",
}: McpServerCellProps) {
  const displayName = getMcpDisplayName(server);
  const primaryPackage = getPrimaryPackageType(server.packages);
  const starsDisplay = formatStars(server.githubStars);

  return (
    <Link
      className={cn(
        "flex items-center gap-3 px-4 transition-colors hover:bg-muted/50",
        heightClass
      )}
      href={`/mcp/${encodeURIComponent(server.name)}`}
    >
      {server.iconUrl ? (
        <img
          alt={displayName}
          className="size-10 rounded border border-border object-contain"
          height={40}
          src={server.iconUrl}
          width={40}
        />
      ) : (
        <div className="flex size-10 items-center justify-center rounded border border-border bg-muted">
          <CubeIcon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-sm">{displayName}</span>
        {server.description && (
          <span className="line-clamp-1 text-muted-foreground text-xs">
            {server.description}
          </span>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          {primaryPackage && (
            <Badge
              className="h-4 px-1.5 text-[10px]"
              variant={primaryPackage === "npm" ? "default" : "secondary"}
            >
              {primaryPackage}
            </Badge>
          )}
          {server.githubStars !== undefined && server.githubStars > 0 && (
            <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
              <StarIcon className="size-3" weight="fill" />
              {starsDisplay}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function McpServerCellSkeleton({
  heightClass = "h-24",
  delay = 0,
}: {
  heightClass?: string;
  delay?: number;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4", heightClass)}>
      <AnimatedSkeleton className="size-10 rounded" delay={delay} />
      <div className="flex flex-col gap-1">
        <AnimatedSkeleton
          className="h-4 w-24"
          delay={delay + 0.05}
          variant="text"
        />
        <AnimatedSkeleton
          className="h-3 w-36"
          delay={delay + 0.1}
          variant="text"
        />
        <div className="flex items-center gap-2">
          <AnimatedSkeleton
            className="h-4 w-8"
            delay={delay + 0.15}
            variant="text"
          />
        </div>
      </div>
    </div>
  );
}
