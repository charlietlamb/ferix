"use client";

import type { McpServerBase } from "@ferix/ui/lib/mcp";
import { useTranslations } from "next-intl";
import { McpPackageCard } from "./mcp-package-card";

interface McpDetailContentProps {
  server: McpServerBase;
}

export function McpDetailContent({ server }: McpDetailContentProps) {
  const t = useTranslations("pages.mcp.detail");

  if (server.packages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("packages")}: 0</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("packages")}
      </h2>
      <div className="flex flex-col gap-3">
        {server.packages.map((pkg, index) => (
          <McpPackageCard
            key={`${pkg.registryType}-${pkg.identifier}-${index}`}
            pkg={pkg}
          />
        ))}
      </div>
    </div>
  );
}
