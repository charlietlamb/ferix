"use client";

import type { Prompt } from "@ferix/server/types";
import { PromptCard } from "@ferix/ui/components/prompts/prompt-card";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface PromptGridProps {
  prompts: Prompt[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

const CARD_HEIGHT = 320;
const GAP = 16;
const COLUMNS = 3;

export function PromptGrid({
  prompts,
  hasMore,
  isLoading,
  onLoadMore,
}: PromptGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(prompts.length / COLUMNS) + (hasMore ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 2,
    onChange: (instance) => {
      const lastItem = instance.getVirtualItems().at(-1);
      if (!lastItem) {
        return;
      }

      const lastDataRow = Math.ceil(prompts.length / COLUMNS) - 1;
      if (lastItem.index >= lastDataRow && hasMore && !isLoading) {
        onLoadMore();
      }
    },
  });

  if (prompts.length === 0 && !isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No prompts found
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] overflow-auto p-1" ref={parentRef}>
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * COLUMNS;
          const rowPrompts = prompts.slice(startIndex, startIndex + COLUMNS);
          const isLoaderRow =
            virtualRow.index >= Math.ceil(prompts.length / COLUMNS);

          return (
            <div
              className="absolute top-0 left-0 grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              key={virtualRow.key}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="col-span-full flex items-center justify-center text-muted-foreground">
                  {hasMore ? "Loading..." : "No more prompts"}
                </div>
              ) : (
                rowPrompts.map((prompt) => (
                  <PromptCard key={prompt._id} prompt={prompt} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
