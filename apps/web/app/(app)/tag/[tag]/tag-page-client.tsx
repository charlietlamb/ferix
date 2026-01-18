"use client";

import { api } from "@ferix/server/_generated/api";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { PromptGrid } from "@ferix/ui/components/prompts/grid/prompt-grid";
import { getTagById } from "@ferix/ui/lib/tags";
import { usePaginatedQuery } from "convex/react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";

interface TagPageClientProps {
  tag: string;
}

export function TagPageClient({ tag: tagId }: TagPageClientProps) {
  const t = useTranslations("pages.tag");
  const tag = getTagById(tagId);

  const { results, status, loadMore } = usePaginatedQuery(
    api.prompts.listByTag,
    { tag: tagId },
    { initialNumItems: 20 }
  );

  if (!tag) {
    notFound();
  }

  const Icon = tag.icon;

  return (
    <AppPage>
      <PageHeader className="flex flex-row items-center justify-between border-border border-b">
        <div>
          <PageHeaderTitle>{tag.label}</PageHeaderTitle>
          <PageHeaderDescription>
            {`${t("description")} ${tag.label}`}
          </PageHeaderDescription>
        </div>
        <Icon size={24} />
      </PageHeader>
      <PromptGrid
        hideBorderTop
        onLoadMore={() => loadMore(20)}
        prompts={results}
        status={status}
      />
    </AppPage>
  );
}
