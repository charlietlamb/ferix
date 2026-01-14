"use client";

import type { Id } from "@ferix/server/_generated/dataModel";
import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { CopyButton } from "@ferix/ui/components/utils/copy-button";
import { LinkIcon } from "@phosphor-icons/react";

interface PromptDetailHeaderProps {
  promptId: Id<"prompts">;
  title: string;
  slug: string;
  type: "subagent" | "rule";
  content: string;
}

export function PromptDetailHeader({
  promptId,
  title,
  slug,
  type,
  content,
}: PromptDetailHeaderProps) {
  const promptUrl = `${window.location.origin}/prompt/${slug}`;

  return (
    <div className="flex items-center justify-between border-border border-b p-4">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate font-medium text-lg">{title}</h1>
        <TypeBadge type={type} />
      </div>
      <div className="flex items-center gap-1">
        <CopyButton content={promptUrl} icon={LinkIcon} />
        <CopyButton content={content} promptId={promptId} />
      </div>
    </div>
  );
}
