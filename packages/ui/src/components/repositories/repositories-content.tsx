"use client";

import { api } from "@ferix/server/_generated/api";
import {
  RepositoryCell,
  RepositoryCellSkeleton,
} from "@ferix/ui/components/repositories/repository-cell";
import { useInfiniteScroll } from "@ferix/ui/hooks/use-infinite-scroll";
import { getGridItemBorderClasses } from "@ferix/ui/lib/repositories";
import { FolderIcon } from "@phosphor-icons/react";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

function RepositoriesGridSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 48 }, (_, i) => (
          <li
            className={getGridItemBorderClasses(i, 8, {
              alwaysShowBottomBorder: true,
            })}
            key={i}
          >
            <RepositoryCellSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RepositoriesContent() {
  const t = useTranslations("pages.repositories");
  const { results, status, loadMore } = usePaginatedQuery(
    api.directories.list,
    { orderBy: "popular" },
    { initialNumItems: 48 }
  );

  const validRepositories = useMemo(
    () => results.filter((repo) => repo.owner && repo.repo),
    [results]
  );

  const loadMoreRef = useInfiniteScroll({
    hasMore: status === "CanLoadMore",
    isLoading: status === "LoadingMore",
    onLoadMore: () => loadMore(20),
  });

  if (status === "LoadingFirstPage") {
    return <RepositoriesGridSkeleton />;
  }

  if (validRepositories.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <FolderIcon className="size-12 text-muted-foreground" />
        <span className="text-muted-foreground">{t("empty")}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {validRepositories.map((repository, i) => (
          <li
            className={getGridItemBorderClasses(i, validRepositories.length, {
              alwaysShowBottomBorder: true,
            })}
            key={repository._id}
          >
            <RepositoryCell repository={repository} />
          </li>
        ))}
      </ul>
      <div ref={loadMoreRef} />
      {status === "LoadingMore" && (
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              className={getGridItemBorderClasses(i, 4, {
                alwaysShowBottomBorder: true,
              })}
              key={i}
            >
              <RepositoryCellSkeleton />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
