"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import { McpDetailPage } from "@ferix/ui/components/mcp/detail/mcp-detail-page";

interface McpDetailPageClientProps {
  serverName: string;
}

export function McpDetailPageClient({ serverName }: McpDetailPageClientProps) {
  return (
    <AppPage>
      <McpDetailPage serverName={serverName} />
    </AppPage>
  );
}
