"use client";

import type { Prompt } from "@ferix/server/types";
import { PromptCell } from "@ferix/ui/components/prompts/prompt-cell";
import { PromptGridEmpty } from "@ferix/ui/components/prompts/prompt-grid-empty";
import { PromptGridSkeleton } from "@ferix/ui/components/prompts/prompt-grid-skeleton";
import type { PaginationStatus } from "convex/browser";
import { useEffect, useRef } from "react";

interface PromptGridProps {
  prompts: Prompt[];
  status: PaginationStatus;
  onLoadMore: () => void;
}

export function PromptGrid({ prompts, status, onLoadMore }: PromptGridProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const hasMore = status === "CanLoadMore";
  const isLoading = status === "LoadingMore";

  useEffect(() => {
    const loader = loaderRef.current;
    if (!(loader && hasMore) || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (status === "LoadingFirstPage") {
    return <PromptGridSkeleton />;
  }

  if (prompts.length === 0 && !isLoading) {
    return <PromptGridEmpty />;
  }

  return (
    <div className="scrollbar-minimal h-full overflow-auto">
      <div className="overflow-hidden">
        <div className="-mr-px grid grid-cols-1 border-border border-t md:grid-cols-2 lg:grid-cols-3">
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
