"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import {
  DirectoryCell,
  DirectoryCellSkeleton,
} from "@ferix/ui/components/directories/directory-cell";
import { DirectoryGridHeader } from "@ferix/ui/components/home/directories/directory-grid-header";
import {
  getGridItemBorderClasses,
  getTopDirectories,
} from "@ferix/ui/lib/directories";
import { useQuery } from "convex/react";

interface DirectoryGridInnerProps {
  directories: Array<{
    _id: string;
    owner: string;
    repo: string;
  }>;
  counts: Record<string, number> | undefined;
}

function DirectoryGridInner({ directories, counts }: DirectoryGridInnerProps) {
  return (
    <div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {directories.map((directory, i) => (
          <li
            className={getGridItemBorderClasses(i, directories.length)}
            key={directory._id}
          >
            <DirectoryCell
              count={counts?.[directory._id]}
              directory={directory}
              heightClass="h-24"
              showAvatar
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DirectoryGridSkeleton() {
  return (
    <section className="flex flex-col border-border border-b">
      <DirectoryGridHeader />
      <div className="grid grid-cols-2 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div className={getGridItemBorderClasses(i, 4)} key={i}>
            <DirectoryCellSkeleton heightClass="h-24" showAvatar />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DirectoryGrid() {
  const topDirectoryInfo = getTopDirectories();
  const allDirectories = useQuery(api.directories.list);

  const matchedDirectories = allDirectories?.filter((dir) =>
    topDirectoryInfo.some(
      (top) => top.owner === dir.owner && top.repo === dir.repo
    )
  );

  const directoryIds =
    matchedDirectories?.map((d) => d._id as Id<"directories">) ?? [];

  const counts = useQuery(
    api.stats.countByDirectories,
    directoryIds.length > 0 ? { directoryIds } : "skip"
  );

  if (!(allDirectories && matchedDirectories)) {
    return <DirectoryGridSkeleton />;
  }

  if (matchedDirectories.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col border-border border-b">
      <DirectoryGridHeader />
      <DirectoryGridInner counts={counts} directories={matchedDirectories} />
    </section>
  );
}
