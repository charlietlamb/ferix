"use client";

import { Link } from "@ferix/i18n/navigation";
import type { Prompt } from "@ferix/server/types";
import { PromptCell } from "@ferix/ui/components/prompts/prompt-cell";
import { cn } from "@ferix/ui/lib/utils";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

interface PromptListProps {
  prompts: Prompt[];
  title: string;
  viewMorePath: string;
}

export function PromptList({ prompts, title, viewMorePath }: PromptListProps) {
  const t = useTranslations("prompts");

  if (prompts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 px-4 py-2">
          <h2 className="text-lg tracking-tight">{title}</h2>
        </div>
        <Link
          className="flex h-full items-center gap-1 pr-2 text-muted-foreground text-xs hover:text-foreground"
          href={`/${viewMorePath}`}
        >
          {t("viewAll")}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      <div className="scrollbar-none flex overflow-x-auto border-border border-t">
        {prompts.map((prompt, index) => (
          <div
            className={cn(
              "w-80 shrink-0 border-border border-b",
              index < prompts.length - 1 && "border-r"
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
