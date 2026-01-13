"use client";

import type { Prompt } from "@ferix/server/types";
import { PromptCell } from "@ferix/ui/components/prompts/prompt-cell";
import { useEffect, useRef } from "react";

interface PromptGridProps {
  prompts: Prompt[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function PromptGrid({
  prompts,
  hasMore,
  isLoading,
  onLoadMore,
}: PromptGridProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

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

  if (prompts.length === 0 && !isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No prompts found
      </div>
    );
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
