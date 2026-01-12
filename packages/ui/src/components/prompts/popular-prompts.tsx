"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptCard } from "@ferix/ui/components/prompts/prompt-card";
import { ScrollArea } from "@ferix/ui/components/ui/scroll-area";
import { TrendUpIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function PopularPrompts() {
  const t = useTranslations("prompts.popular");
  const prompts = useQuery(api.prompts.listPopular, { limit: 6 });

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <TrendUpIcon className="size-4 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-xl">{t("title")}</h2>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-2 pl-0.5">
          {prompts.map((prompt) => (
            <div className="w-80 shrink-0" key={prompt._id}>
              <PromptCard
                content={prompt.content}
                creator={prompt.creator}
                downloads={prompt.downloads}
                title={prompt.title}
                type={prompt.type}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
