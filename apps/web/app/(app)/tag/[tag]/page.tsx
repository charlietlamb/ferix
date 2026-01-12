"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptGrid } from "@ferix/ui/components/prompts/prompt-grid";
import { getTagById } from "@ferix/ui/lib/tags";
import { usePaginatedQuery } from "convex/react";
import { notFound } from "next/navigation";
import { use } from "react";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export default function TagPage({ params }: TagPageProps) {
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon color="default" size={32} />
        <h1 className="font-bold text-3xl">{tag.label}</h1>
      </div>
      <PromptGrid
        hasMore={status === "CanLoadMore"}
        isLoading={status === "LoadingMore"}
        onLoadMore={() => loadMore(20)}
        prompts={results}
      />
    </div>
  );
}
