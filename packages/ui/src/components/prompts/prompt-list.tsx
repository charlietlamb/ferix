"use client";

import type { Prompt } from "@ferix/server/types";
import { PromptCard } from "@ferix/ui/components/prompts/prompt-card";
import { ScrollArea } from "@ferix/ui/components/ui/scroll-area";
import type { ComponentType } from "react";

interface PromptListProps {
  prompts: Prompt[];
  title: string;
  icon: ComponentType<{ className?: string }>;
}

export function PromptList({ prompts, title, icon: Icon }: PromptListProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <h2 className="text-xl">{title}</h2>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-2 px-0.5">
          {prompts.map((prompt) => (
            <div className="w-80 shrink-0" key={prompt._id}>
              <PromptCard prompt={prompt} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
