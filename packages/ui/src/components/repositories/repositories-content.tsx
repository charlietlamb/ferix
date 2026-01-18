"use client";

import { api } from "@ferix/server/_generated/api";
import {
  RepositoryCell,
  RepositoryCellSkeleton,
} from "@ferix/ui/components/repositories/repository-cell";
import { getGridItemBorderClasses } from "@ferix/ui/lib/repositories";
import { FolderIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

function RepositoriesGridSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
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
  const repositories = useQuery(api.directories.list);

  if (repositories === undefined) {
    return <RepositoriesGridSkeleton />;
  }

  const validRepositories = repositories.filter(
    (repo) => repo.owner && repo.repo
  );

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
    </div>
  );
}
