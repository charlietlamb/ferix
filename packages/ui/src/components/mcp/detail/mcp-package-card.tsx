"use client";

import { Badge } from "@ferix/ui/components/ui/badge";
import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import {
  getInstallCommand,
  getTransportDescription,
  type McpPackage,
} from "@ferix/ui/lib/mcp";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface McpPackageCardProps {
  pkg: McpPackage;
}

export function McpPackageCard({ pkg }: McpPackageCardProps) {
  const t = useTranslations("pages.mcp.detail");
  const { copied, copy } = useCopy();

  const installCommand = getInstallCommand(pkg);
  const transportDescription = getTransportDescription(pkg.transport);

  const handleCopy = async () => {
    if (!copied) {
      await copy(installCommand);
      toast.success(t("copied"));
    }
  };

  const registryVariant = (() => {
    switch (pkg.registryType) {
      case "npm":
        return "default";
      case "pypi":
        return "secondary";
      case "oci":
        return "outline";
      case "nuget":
        return "outline";
      default:
        return "outline";
    }
  })();

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={registryVariant}>{pkg.registryType}</Badge>
          <span className="text-muted-foreground text-sm">
            {transportDescription}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
        <code className="flex-1 font-mono text-sm">{installCommand}</code>
        <Button
          className="size-7 shrink-0"
          onClick={handleCopy}
          size="icon"
          title={t("copyCommand")}
          variant="ghost"
        >
          {copied ? (
            <CheckIcon className="size-4 text-green-500" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
