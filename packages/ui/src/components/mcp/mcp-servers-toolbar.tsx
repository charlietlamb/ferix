"use client";

import { Input } from "@ferix/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ferix/ui/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@ferix/ui/components/ui/toggle-group";
import type { McpRegistryType, McpTransportType } from "@ferix/ui/lib/mcp";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export type McpSortBy = "stars" | "recent" | "name";

interface McpServersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: McpSortBy;
  onSortByChange: (value: McpSortBy) => void;
  registryFilter: McpRegistryType | null;
  onRegistryFilterChange: (value: McpRegistryType | null) => void;
  transportFilter: McpTransportType | null;
  onTransportFilterChange: (value: McpTransportType | null) => void;
}

export function McpServersToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  registryFilter,
  onRegistryFilterChange,
  transportFilter,
  onTransportFilterChange,
}: McpServersToolbarProps) {
  const t = useTranslations("pages.mcp");

  const registryOptions: Array<{
    value: McpRegistryType | "all";
    label: string;
  }> = [
    { value: "all", label: t("filters.all") },
    { value: "npm", label: "npm" },
    { value: "pypi", label: "pypi" },
    { value: "oci", label: "oci" },
    { value: "nuget", label: "nuget" },
  ];

  const transportOptions: Array<{
    value: McpTransportType | "all";
    label: string;
  }> = [
    { value: "all", label: t("filters.all") },
    { value: "stdio", label: "stdio" },
    { value: "sse", label: "sse" },
    { value: "streamable-http", label: "http" },
  ];

  return (
    <div className="flex flex-col gap-3 border-border border-b px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            type="search"
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) => onSortByChange(value as McpSortBy)}
          value={sortBy}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">{t("sortByStars")}</SelectItem>
            <SelectItem value="recent">{t("sortByRecent")}</SelectItem>
            <SelectItem value="name">{t("sortByName")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {t("filters.registry")}:
          </span>
          <ToggleGroup
            multiple={false}
            onValueChange={(values) => {
              const value = values[0] ?? "all";
              onRegistryFilterChange(
                value === "all" ? null : (value as McpRegistryType)
              );
            }}
            value={[registryFilter ?? "all"]}
            variant="outline"
          >
            {registryOptions.map((option) => (
              <ToggleGroupItem
                className="h-7 px-2 text-xs"
                key={option.value}
                value={option.value}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {t("filters.transport")}:
          </span>
          <ToggleGroup
            multiple={false}
            onValueChange={(values) => {
              const value = values[0] ?? "all";
              onTransportFilterChange(
                value === "all" ? null : (value as McpTransportType)
              );
            }}
            value={[transportFilter ?? "all"]}
            variant="outline"
          >
            {transportOptions.map((option) => (
              <ToggleGroupItem
                className="h-7 px-2 text-xs"
                key={option.value}
                value={option.value}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
