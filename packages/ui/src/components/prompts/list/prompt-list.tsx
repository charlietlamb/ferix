"use client";

import type { Prompt } from "@ferix/server/types";
import { PromptCell } from "@ferix/ui/components/prompts/cell/prompt-cell";
import { PromptListHeader } from "@ferix/ui/components/prompts/list/prompt-list-header";
import { cn } from "@ferix/ui/lib/utils";

interface PromptListProps {
  prompts: Prompt[];
  title: string;
  viewMorePath: string;
}

export function PromptList({ prompts, title, viewMorePath }: PromptListProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col border-border border-b">
      <PromptListHeader title={title} viewMorePath={viewMorePath} />
      <div className="scrollbar-none flex overflow-x-auto">
        {prompts.map((prompt, index) => (
          <div
            className={cn(
              "w-80 shrink-0",
              index < prompts.length - 1 && "border-border border-r"
            )}
            key={prompt._id}
          >
            <PromptCell prompt={prompt} />
          </div>
        ))}
      </div>
    </section>
  );
}
