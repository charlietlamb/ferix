"use client";

import { api } from "@ferix/server/_generated/api";
import {
  DirectoryCell,
  DirectoryCellSkeleton,
} from "@ferix/ui/components/directories/directory-cell";
import { getGridItemBorderClasses } from "@ferix/ui/lib/directories";
import { FolderIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

function DirectoriesGridSkeleton() {
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
            <DirectoryCellSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DirectoriesContent() {
  const t = useTranslations("pages.directories");
  const directories = useQuery(api.directories.list);

  if (directories === undefined) {
    return <DirectoriesGridSkeleton />;
  }

  const validDirectories = directories.filter((dir) => dir.owner && dir.repo);

  if (validDirectories.length === 0) {
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
        {validDirectories.map((directory, i) => (
          <li
            className={getGridItemBorderClasses(i, validDirectories.length, {
              alwaysShowBottomBorder: true,
            })}
            key={directory._id}
          >
            <DirectoryCell directory={directory} />
          </li>
        ))}
      </ul>
    </div>
  );
}
