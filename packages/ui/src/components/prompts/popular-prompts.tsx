"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptCard } from "@ferix/ui/components/prompts/prompt-card";
import { FlaskIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

export function PopularPrompts() {
  const t = useTranslations("prompts.popular");
  const prompts = useQuery(api.prompts.listPopular, { limit: 6 });

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-md border-border bg-muted px-2 py-1">
          <FlaskIcon className="size-4" />
          <h2 className="text-lg">{t("title")}</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <PromptCard
            content={prompt.content}
            downloads={prompt.downloads}
            key={prompt._id}
            title={prompt.title}
            type={prompt.type}
          />
        ))}
      </div>
    </section>
  );
}
