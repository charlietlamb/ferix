"use client";

import { api } from "@ferix/server/_generated/api";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/header/page-header";
import { PromptGrid } from "@ferix/ui/components/prompts/prompt-grid";
import { getTagById } from "@ferix/ui/lib/tags";
import { usePaginatedQuery } from "convex/react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { use } from "react";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default function TagPage({ params }: TagPageProps) {
  const t = useTranslations("pages.tag");
  const { tag: tagId } = use(params);
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
    <div>
      <PageHeader className="flex flex-row items-center justify-between">
        <div>
          <PageHeaderTitle>{tag.label}</PageHeaderTitle>
          <PageHeaderDescription>
            {`${t("description")} ${tag.label}`}
          </PageHeaderDescription>
        </div>
        <Icon size={24} />
      </PageHeader>
      <PromptGrid
        hasMore={status === "CanLoadMore"}
        isLoading={status === "LoadingMore"}
        onLoadMore={() => loadMore(20)}
        prompts={results}
      />
    </div>
  );
}
