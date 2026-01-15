"use client";

import { PromptCellSkeleton } from "@ferix/ui/components/prompts/cell/prompt-cell-skeleton";
import { PromptListHeader } from "@ferix/ui/components/prompts/list/prompt-list-header";
import { cn } from "@ferix/ui/lib/utils";

interface PromptListSkeletonProps {
  title: string;
  viewMorePath: string;
  count?: number;
}

export function PromptListSkeleton({
  title,
  viewMorePath,
  count = 8,
}: PromptListSkeletonProps) {
  return (
    <section className="flex flex-col border-border border-b">
      <PromptListHeader title={title} viewMorePath={viewMorePath} />
      <div className="scrollbar-none flex overflow-x-auto">
        {Array.from({ length: count }).map((_, i) => (
          <div
            className={cn(
              "w-80 shrink-0",
              i < count - 1 && "border-border border-r"
            )}
            key={i}
          >
            <PromptCellSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}
