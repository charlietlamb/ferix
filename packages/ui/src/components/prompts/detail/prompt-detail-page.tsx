"use client";

import type { Id } from "@ferix/server/_generated/dataModel";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PromptDetailContent } from "@ferix/ui/components/prompts/detail/prompt-detail-content";
import { PromptDetailHeader } from "@ferix/ui/components/prompts/detail/prompt-detail-header";
import { PromptDetailSidebar } from "@ferix/ui/components/prompts/detail/prompt-detail-sidebar";

interface PromptDetailPageProps {
  prompt: {
    _id: Id<"prompts">;
    title: string;
    slug: string;
    content: string;
    type: "subagent" | "rule";
    tags: string[];
    downloads: number;
    createdAt: number;
    updatedAt: number;
    creator: { name: string; image: string | null } | null;
    isCreator: boolean;
    isSaved: boolean;
    saveCount: number;
  };
}

export function PromptDetailPage({ prompt }: PromptDetailPageProps) {
  return (
    <AppPage>
      <PromptDetailHeader
        content={prompt.content}
        isCreator={prompt.isCreator}
        promptId={prompt._id}
        slug={prompt.slug}
        title={prompt.title}
        type={prompt.type}
      />
      <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 lg:flex-row">
        <PromptDetailContent
          isCreator={prompt.isCreator}
          promptId={prompt._id}
          serverContent={prompt.content}
        />
        <PromptDetailSidebar
          createdAt={prompt.createdAt}
          creator={prompt.creator}
          downloads={prompt.downloads}
          isCreator={prompt.isCreator}
          isSaved={prompt.isSaved}
          promptId={prompt._id}
          saveCount={prompt.saveCount}
          slug={prompt.slug}
          tags={prompt.tags}
          title={prompt.title}
          updatedAt={prompt.updatedAt}
        />
      </div>
    </AppPage>
  );
}
