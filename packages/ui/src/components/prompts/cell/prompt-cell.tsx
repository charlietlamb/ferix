"use client";

import { Link } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { UserLink } from "@ferix/ui/components/user/user-link";
import { SaveButton } from "@ferix/ui/components/utils/save-button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
import { getTagById } from "@ferix/ui/lib/tags";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  GavelIcon,
  UserRectangleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";

interface PromptCellProps {
  prompt: Prompt;
}

const typeIcons = {
  subagent: UserRectangleIcon,
  rule: GavelIcon,
};

export function PromptCell({ prompt }: PromptCellProps) {
  const recordDownload = useMutation(api.prompts.recordDownload);
  const { copy, copied } = useCopy();
  const firstTagId = prompt.tags[0];
  const firstTag = firstTagId ? getTagById(firstTagId) : null;
  const TypeIcon = firstTag?.icon ?? typeIcons[prompt.type];

  const { current: isSaved, setOptimistic: setOptimisticSaved } =
    useOptimisticState(prompt.isSaved);
  const { current: downloads, setOptimistic: setOptimisticDownloads } =
    useOptimisticState(prompt.downloads);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!copied) {
      setOptimisticDownloads(prompt.downloads + 1);
      recordDownload({ promptId: prompt._id });
      copy(prompt.content);
    }
  };

  return (
    <Link
      className="group flex h-full w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/50"
      href={`/prompt/${prompt.slug}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {firstTag ? (
            <TypeIcon className="text-foreground" size={16} />
          ) : (
            <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="line-clamp-1 text-sm">{prompt.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <TypeBadge type={prompt.type} />
          <button onClick={handleCopy} type="button">
            {copied ? (
              <CheckIcon className="size-4 text-green-500" />
            ) : (
              <CopyIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </button>
        </div>
      </div>

      <div className="w-full flex-1 overflow-hidden rounded border border-border/50 bg-muted">
        <div className="flex items-center gap-1.5 border-border/50 border-b px-3 py-2">
          <div className="size-2 rounded-full bg-red-500/60" />
          <div className="size-2 rounded-full bg-yellow-500/60" />
          <div className="size-2 rounded-full bg-green-500/60" />
        </div>
        <pre className="h-20 overflow-hidden p-2 font-mono text-xs">
          <code className="line-clamp-4 whitespace-pre-wrap text-muted-foreground">
            {prompt.content}
          </code>
        </pre>
      </div>

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        {prompt.creator ? (
          <UserLink
            image={prompt.creator.image}
            name={prompt.creator.name}
            username={prompt.creator.username}
          />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <DownloadIcon className="size-3" />
            <span>{downloads.toLocaleString()}</span>
          </div>
          <SaveButton
            isSaved={isSaved}
            onOptimisticUpdate={setOptimisticSaved}
            promptId={prompt._id}
            variant="icon"
          />
        </div>
      </div>
    </Link>
  );
}
