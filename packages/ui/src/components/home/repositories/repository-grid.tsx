"use client";

import { api } from "@ferix/server/_generated/api";
import { RepositoryGridHeader } from "@ferix/ui/components/home/repositories/repository-grid-header";
import {
  RepositoryCell,
  RepositoryCellSkeleton,
} from "@ferix/ui/components/repositories/repository-cell";
import { getGridItemBorderClasses } from "@ferix/ui/lib/repositories";
import { useQuery } from "convex/react";

interface Repository {
  _id: string;
  owner: string;
  repo: string;
  name?: string;
  promptCount: number;
  totalDownloads: number;
}

interface RepositoryGridInnerProps {
  repositories: Repository[];
}

function RepositoryGridInner({ repositories }: RepositoryGridInnerProps) {
  return (
    <div>
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {repositories.map((repository, i) => (
          <li
            className={getGridItemBorderClasses(i, repositories.length)}
            key={repository._id}
          >
            <RepositoryCell
              count={repository.promptCount}
              heightClass="h-24"
              repository={repository}
              showAvatar
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RepositoryGridSkeleton() {
  return (
    <section className="flex flex-col border-border border-b">
      <RepositoryGridHeader />
      <div className="grid grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <div className={getGridItemBorderClasses(i, 12)} key={i}>
            <RepositoryCellSkeleton heightClass="h-24" showAvatar />
          </div>
        ))}
      </div>
    </section>
  );
}

export function RepositoryGrid() {
  const repositories = useQuery(api.directories.listFeatured, { limit: 12 });

  if (repositories === undefined) {
    return <RepositoryGridSkeleton />;
  }

  if (repositories.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col border-border border-b">
      <RepositoryGridHeader />
      <RepositoryGridInner repositories={repositories} />
    </section>
  );
}
