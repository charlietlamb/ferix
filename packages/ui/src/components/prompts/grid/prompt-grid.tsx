"use client";

import type { Prompt } from "@ferix/server/types";
import { PromptCell } from "@ferix/ui/components/prompts/cell/prompt-cell";
import { PromptGridEmpty } from "@ferix/ui/components/prompts/grid/prompt-grid-empty";
import { PromptGridSkeleton } from "@ferix/ui/components/prompts/grid/prompt-grid-skeleton";
import { useInfiniteScroll } from "@ferix/ui/hooks/use-infinite-scroll";
import { cn } from "@ferix/ui/lib/utils";
import type { PaginationStatus } from "convex/browser";

interface PromptGridProps {
  prompts: Prompt[];
  status: PaginationStatus;
  onLoadMore: () => void;
  hideBorderTop?: boolean;
}

export function PromptGrid({
  prompts,
  status,
  onLoadMore,
  hideBorderTop = false,
}: PromptGridProps) {
  const hasMore = status === "CanLoadMore";
  const isLoading = status === "LoadingMore";

  const loaderRef = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
  });

  if (status === "LoadingFirstPage") {
    return (
      <PromptGridSkeleton
        className={hideBorderTop ? "border-t-0" : undefined}
      />
    );
  }

  if (prompts.length === 0 && !isLoading) {
    return <PromptGridEmpty />;
  }

  return (
    <div className="scrollbar-none h-full overflow-auto">
      <div className="overflow-hidden">
        <div
          className={cn(
            "-mr-px grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            !hideBorderTop &&
              "border-foreground/[0.06] border-t dark:border-foreground/[0.08]"
          )}
        >
          {prompts.map((prompt) => (
            <div
              className="border-foreground/[0.06] border-r border-b transition-colors duration-200 hover:border-foreground/10 dark:border-foreground/[0.08] dark:hover:border-foreground/12"
              key={prompt._id}
            >
              <PromptCell prompt={prompt} />
            </div>
          ))}
        </div>
      </div>
      {hasMore && (
        <div
          className="flex items-center justify-center py-8 text-foreground/50"
          ref={loaderRef}
        >
          {isLoading ? "Loading..." : ""}
        </div>
      )}
    </div>
  );
}
