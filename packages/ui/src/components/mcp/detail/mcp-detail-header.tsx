"use client";

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { Badge } from "@ferix/ui/components/ui/badge";
import {
  formatStars,
  getMcpDisplayName,
  type McpServerBase,
} from "@ferix/ui/lib/mcp";
import { CubeIcon, StarIcon } from "@phosphor-icons/react";

interface McpDetailHeaderProps {
  server: McpServerBase;
}

export function McpDetailHeader({ server }: McpDetailHeaderProps) {
  const displayName = getMcpDisplayName(server);
  const starsDisplay = formatStars(server.githubStars);

  return (
    <PageHeader className="flex flex-row items-center justify-between border-border border-b">
      <div className="flex items-center gap-3">
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
        <div className="flex flex-col">
          <PageHeaderTitle>{displayName}</PageHeaderTitle>
          {server.description && (
            <PageHeaderDescription className="line-clamp-1 max-w-xl">
              {server.description}
            </PageHeaderDescription>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline">v{server.version}</Badge>
        {server.githubStars !== undefined && server.githubStars > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <StarIcon className="size-4" weight="fill" />
            {starsDisplay}
          </span>
        )}
      </div>
    </PageHeader>
  );
}
