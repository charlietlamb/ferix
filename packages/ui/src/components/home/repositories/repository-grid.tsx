"use client";

import { api } from "@ferix/server/_generated/api";
import { RepositoryGridHeader } from "@ferix/ui/components/home/repositories/repository-grid-header";
import {
  RepositoryCell,
  RepositoryCellSkeleton,
} from "@ferix/ui/components/repositories/repository-cell";
import { getGridItemBorderClasses } from "@ferix/ui/lib/repositories";
import { useQuery } from "convex/react";
import { motion } from "motion/react";

/** Stagger delay between grid items (in seconds) */
const STAGGER_DELAY = 0.03;

/** Animation configuration for grid items */
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * STAGGER_DELAY,
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] as const,
    },
  }),
};

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
          <motion.li
            animate="visible"
            className={getGridItemBorderClasses(i, repositories.length)}
            custom={i}
            initial="hidden"
            key={repository._id}
            variants={itemVariants}
          >
            <RepositoryCell
              count={repository.promptCount}
              heightClass="h-24"
              repository={repository}
              showAvatar
            />
          </motion.li>
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
            <RepositoryCellSkeleton
              delay={i * STAGGER_DELAY}
              heightClass="h-24"
              showAvatar
            />
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
