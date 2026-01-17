"use client";

import { api } from "@ferix/server/_generated/api";
import {
  DirectoryCell,
  DirectoryCellSkeleton,
} from "@ferix/ui/components/directories/directory-cell";
import { DirectoryGridHeader } from "@ferix/ui/components/home/directories/directory-grid-header";
import { getGridItemBorderClasses } from "@ferix/ui/lib/directories";
import { useQuery } from "convex/react";

interface DirectoryGridInnerProps {
  directories: Array<{
    _id: string;
    owner: string;
    repo: string;
    promptCount: number;
  }>;
}

function DirectoryGridInner({ directories }: DirectoryGridInnerProps) {
  return (
    <div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {directories.map((directory, i) => (
          <li
            className={getGridItemBorderClasses(i, directories.length)}
            key={directory._id}
          >
            <DirectoryCell
              count={directory.promptCount}
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
  const topDirectories = useQuery(api.directories.listTopByDownloads, {
    limit: 10,
  });

  if (!topDirectories) {
    return <DirectoryGridSkeleton />;
  }

  if (topDirectories.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col border-border border-b">
      <DirectoryGridHeader />
      <DirectoryGridInner directories={topDirectories} />
    </section>
  );
}
