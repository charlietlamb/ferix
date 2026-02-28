"use client";

import { api } from "@ferix/server/_generated/api";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import { McpDetailContent } from "./mcp-detail-content";
import { McpDetailHeader } from "./mcp-detail-header";
import { McpDetailSidebar } from "./mcp-detail-sidebar";
import { McpDetailSkeleton } from "./mcp-detail-skeleton";

interface McpDetailPageProps {
  serverName: string;
}

export function McpDetailPage({ serverName }: McpDetailPageProps) {
  const server = useQuery(api.mcpServers.getByName, { name: serverName });

  if (server === undefined) {
    return <McpDetailSkeleton />;
  }

  if (server === null) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <McpDetailHeader server={server} />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex-1 overflow-y-auto">
          <McpDetailContent server={server} />
        </div>
        <McpDetailSidebar server={server} />
      </div>
    </div>
  );
}
