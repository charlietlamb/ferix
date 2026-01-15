"use client";

import type { Id } from "@ferix/server/_generated/dataModel";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PromptDetailContent } from "@ferix/ui/components/prompts/detail/prompt-detail-content";
import { PromptDetailActions } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-actions";
import { PromptDetailAuthor } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-author";
import { PromptDetailDates } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-dates";
import { PromptDetailDirectory } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-directory";
import { PromptDetailStats } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-stats";
import { PromptDetailTags } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-tags";
import { PromptDetailUrlEditor } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-url-editor";

interface PromptDetailPageProps {
  prompt: {
    _id: Id<"prompts">;
    title: string;
    slug: string;
    content: string;
    type: "subagent" | "rule";
    tags: string[];
    directoryId?: string;
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
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Content - left side on desktop */}
        <PromptDetailContent
          isCreator={prompt.isCreator}
          promptId={prompt._id}
          serverContent={prompt.content}
          slug={prompt.slug}
          title={prompt.title}
          type={prompt.type}
        />

        {/* Sidebar - right side on desktop, stacked cells */}
        <aside className="flex flex-col border-border border-t md:w-[320px] md:shrink-0 md:overflow-auto md:border-t-0 md:border-l">
          <PromptDetailAuthor
            creator={prompt.creator}
            directoryId={prompt.directoryId}
          />
          <PromptDetailStats
            downloads={prompt.downloads}
            saveCount={prompt.saveCount}
          />
          <PromptDetailDates
            createdAt={prompt.createdAt}
            updatedAt={prompt.updatedAt}
          />
          <PromptDetailTags
            isCreator={prompt.isCreator}
            promptId={prompt._id}
            tags={prompt.tags}
          />
          <PromptDetailDirectory
            directoryId={prompt.directoryId}
            isCreator={prompt.isCreator}
            promptId={prompt._id}
          />
          {prompt.isCreator && (
            <PromptDetailUrlEditor
              promptId={prompt._id}
              slug={prompt.slug}
              title={prompt.title}
            />
          )}
          <PromptDetailActions
            content={prompt.content}
            isCreator={prompt.isCreator}
            isSaved={prompt.isSaved}
            promptId={prompt._id}
            slug={prompt.slug}
          />
        </aside>
      </div>
    </AppPage>
  );
}
