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
            !hideBorderTop && "border-border border-t"
          )}
        >
          {prompts.map((prompt) => (
            <div className="border-border border-r border-b" key={prompt._id}>
              <PromptCell prompt={prompt} />
            </div>
          ))}
        </div>
      </div>
      {hasMore && (
        <div
          className="flex items-center justify-center py-8 text-muted-foreground"
          ref={loaderRef}
        >
          {isLoading ? "Loading..." : ""}
        </div>
      )}
    </div>
  );
}
