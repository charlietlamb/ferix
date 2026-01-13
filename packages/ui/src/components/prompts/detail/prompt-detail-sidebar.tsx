"use client";

import type { Id } from "@ferix/server/_generated/dataModel";
import { PromptDetailActions } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-actions";
import { PromptDetailAuthor } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-author";
import { PromptDetailDetails } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-details";
import { PromptDetailStats } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-stats";
import { PromptDetailTags } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-tags";
import { PromptDetailUrlEditor } from "@ferix/ui/components/prompts/detail/sections/prompt-detail-url-editor";

interface PromptDetailSidebarProps {
  promptId: Id<"prompts">;
  slug: string;
  title: string;
  creator: { name: string; image: string | null } | null;
  downloads: number;
  saveCount: number;
  isSaved: boolean;
  isCreator: boolean;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export function PromptDetailSidebar({
  promptId,
  slug,
  title,
  creator,
  downloads,
  saveCount,
  isSaved,
  isCreator,
  createdAt,
  updatedAt,
  tags,
}: PromptDetailSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-4 lg:w-[30%]">
      <PromptDetailAuthor creator={creator} />

      {isCreator && (
        <PromptDetailUrlEditor promptId={promptId} slug={slug} title={title} />
      )}

      <PromptDetailStats downloads={downloads} saveCount={saveCount} />

      <PromptDetailDetails createdAt={createdAt} updatedAt={updatedAt} />

      <PromptDetailTags isCreator={isCreator} promptId={promptId} tags={tags} />

      <PromptDetailActions
        isCreator={isCreator}
        isSaved={isSaved}
        promptId={promptId}
      />
    </aside>
  );
}
