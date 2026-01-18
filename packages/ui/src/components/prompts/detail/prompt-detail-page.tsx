"use client";

import type { Id } from "@ferix/server/_generated/dataModel";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PromptDetailContent } from "@ferix/ui/components/prompts/detail/prompt-detail-content";
import { PromptDetailActions } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-actions";
import { PromptDetailAuthor } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-author";
import { PromptDetailDates } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-dates";
import { PromptDetailStats } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-stats";
import { PromptDetailTags } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-tags";
import { PromptDetailType } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-type";
import { PromptDetailUrlEditor } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-url-editor";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import type { PromptType } from "@ferix/ui/lib/prompt-types";
import { PromptDetailInstallBanner } from "./prompt-detail-install-banner";

interface PromptDetailPageProps {
  prompt: {
    _id: Id<"prompts">;
    title: string;
    slug: string;
    content: string;
    type: PromptType;
    tags: string[];
    downloads: number;
    createdAt: number;
    updatedAt: number;
    creator: {
      name: string;
      image: string | null;
      username: string | null;
    } | null;
    directory: {
      _id: string;
      owner: string;
      repo: string;
      promptCount: number;
    } | null;
    isCreator: boolean;
    isSaved: boolean;
    saveCount: number;
  };
}

export function PromptDetailPage({ prompt }: PromptDetailPageProps) {
  const { isAdmin } = useAuthenticated();
  const canEdit = prompt.isCreator || isAdmin;

  return (
    <AppPage>
      {prompt.directory && (
        <PromptDetailInstallBanner
          promptCount={prompt.directory.promptCount}
          repository={prompt.directory}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <PromptDetailContent
          canEdit={canEdit}
          promptId={prompt._id}
          serverContent={prompt.content}
          slug={prompt.slug}
          title={prompt.title}
          type={prompt.type}
        />

        <aside className="flex flex-col overflow-auto border-border border-t md:w-[320px] md:shrink-0 md:border-t-0 md:border-l">
          <PromptDetailAuthor
            creator={prompt.creator}
            repository={prompt.directory}
          />
          <PromptDetailStats
            downloads={prompt.downloads}
            saveCount={prompt.saveCount}
          />
          <PromptDetailDates
            createdAt={prompt.createdAt}
            updatedAt={prompt.updatedAt}
          />
          <PromptDetailType
            canEdit={canEdit}
            promptId={prompt._id}
            type={prompt.type}
          />
          <PromptDetailTags
            canEdit={canEdit}
            promptId={prompt._id}
            tags={prompt.tags}
          />
          {canEdit && (
            <PromptDetailUrlEditor
              promptId={prompt._id}
              slug={prompt.slug}
              title={prompt.title}
            />
          )}
          <PromptDetailActions
            canEdit={canEdit}
            content={prompt.content}
            isSaved={prompt.isSaved}
            promptId={prompt._id}
            slug={prompt.slug}
            title={prompt.title}
          />
        </aside>
      </div>
    </AppPage>
  );
}
