"use client";

import { api } from "@ferix/server/_generated/api";
import {
  McpServerCell,
  McpServerCellSkeleton,
} from "@ferix/ui/components/mcp/mcp-server-cell";
import {
  McpServersToolbar,
  type McpSortBy,
} from "@ferix/ui/components/mcp/mcp-servers-toolbar";
import { useInfiniteScroll } from "@ferix/ui/hooks/use-infinite-scroll";
import {
  getMcpGridItemBorderClasses,
  type McpRegistryType,
  type McpServerBase,
  type McpTransportType,
} from "@ferix/ui/lib/mcp";
import { CubeIcon } from "@phosphor-icons/react";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

function McpServersGridSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 48 }, (_, i) => (
          <li
            className={getMcpGridItemBorderClasses(i, 8, {
              alwaysShowBottomBorder: true,
            })}
            key={i}
          >
            <McpServerCellSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

function filterServers(
  servers: McpServerBase[],
  registryFilter: McpRegistryType | null,
  transportFilter: McpTransportType | null
): McpServerBase[] {
  return servers.filter((server) => {
    if (registryFilter) {
      const hasRegistry = server.packages.some(
        (pkg) => pkg.registryType === registryFilter
      );
      if (!hasRegistry) {
        return false;
      }
    }
    if (transportFilter) {
      const hasTransport = server.packages.some(
        (pkg) => pkg.transport === transportFilter
      );
      if (!hasTransport) {
        return false;
      }
    }
    return true;
  });
}

export function McpServersContent() {
  const t = useTranslations("pages.mcp");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<McpSortBy>("stars");
  const [registryFilter, setRegistryFilter] = useState<McpRegistryType | null>(
    null
  );
  const [transportFilter, setTransportFilter] =
    useState<McpTransportType | null>(null);

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSetSearch(value);
  };

  const { results, status, loadMore } = usePaginatedQuery(
    api.mcpServers.list,
    {
      sortBy,
      search: debouncedSearch || undefined,
    },
    { initialNumItems: 48 }
  );

  const filteredResults = useMemo(
    () => filterServers(results, registryFilter, transportFilter),
    [results, registryFilter, transportFilter]
  );

  const loadMoreRef = useInfiniteScroll({
    hasMore: status === "CanLoadMore",
    isLoading: status === "LoadingMore",
    onLoadMore: () => loadMore(20),
  });

  const renderContent = () => {
    if (status === "LoadingFirstPage") {
      return <McpServersGridSkeleton />;
    }

    if (filteredResults.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <CubeIcon className="size-12 text-muted-foreground" />
          <span className="text-muted-foreground">{t("empty")}</span>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <ul className="grid grid-cols-2 md:grid-cols-4">
          {filteredResults.map((server, i) => (
            <li
              className={getMcpGridItemBorderClasses(
                i,
                filteredResults.length,
                {
                  alwaysShowBottomBorder: true,
                }
              )}
              key={server._id}
            >
              <McpServerCell server={server} />
            </li>
          ))}
        </ul>
        <div ref={loadMoreRef} />
        {status === "LoadingMore" && (
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                className={getMcpGridItemBorderClasses(i, 4, {
                  alwaysShowBottomBorder: true,
                })}
                key={i}
              >
                <McpServerCellSkeleton />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <McpServersToolbar
        onRegistryFilterChange={setRegistryFilter}
        onSearchChange={handleSearchChange}
        onSortByChange={setSortBy}
        onTransportFilterChange={setTransportFilter}
        registryFilter={registryFilter}
        search={search}
        sortBy={sortBy}
        transportFilter={transportFilter}
      />
      {renderContent()}
    </div>
  );
}
