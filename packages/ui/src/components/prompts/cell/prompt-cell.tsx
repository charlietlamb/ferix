"use client";

import { useTrack } from "@ferix/analytics/use-track";
import { Link } from "@ferix/i18n/navigation";
import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import { PromptCellSource } from "@ferix/ui/components/prompts/cell/prompt-cell-source";
import { TypeBadge } from "@ferix/ui/components/prompts/shared/type-badge";
import { SaveButton } from "@ferix/ui/components/utils/save-button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { useOptimisticState } from "@ferix/ui/hooks/use-optimistic-state";
import { stripFrontmatter } from "@ferix/ui/lib/markdown";
import { type PromptType, promptTypeConfigs } from "@ferix/ui/lib/prompt-types";
import { getTagById } from "@ferix/ui/lib/tags";
import { CheckIcon, CopyIcon, DownloadIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";

interface PromptCellProps {
  prompt: Prompt;
}

export function PromptCell({ prompt }: PromptCellProps) {
  const recordDownload = useMutation(api.prompts.recordDownload);
  const { copy, copied } = useCopy();
  const { trackPromptDownload } = useTrack();
  const firstTagId = prompt.tags[0];
  const firstTag = firstTagId ? getTagById(firstTagId) : null;
  const typeConfig = promptTypeConfigs[prompt.type as PromptType];
  const TypeIcon = firstTag?.icon ?? typeConfig?.icon;

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
      trackPromptDownload({
        promptId: prompt._id,
        promptSlug: prompt.slug,
        promptTitle: prompt.title,
      });
    }
  };

  return (
    <Link
      className="group relative flex h-full w-full flex-col gap-3 p-4 text-left transition-all duration-200 ease-out before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/0 before:to-primary/0 before:opacity-0 before:transition-opacity before:duration-200 hover:bg-muted/30 hover:before:from-primary/[0.02] hover:before:to-primary/[0.06] hover:before:opacity-100"
      href={`/prompt/${prompt.slug}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {firstTag ? (
            <TypeIcon
              className="shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-primary"
              size={16}
            />
          ) : (
            <TypeIcon className="size-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
          )}
          <span className="line-clamp-1 font-medium text-sm tracking-tight transition-colors duration-200 group-hover:text-foreground">
            {prompt.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TypeBadge type={prompt.type} />
          <button onClick={handleCopy} type="button">
            {copied ? (
              <CheckIcon className="size-4 text-green-500" />
            ) : (
              <CopyIcon className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:text-foreground group-hover:opacity-100" />
            )}
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 overflow-hidden rounded border border-border/50 bg-muted transition-colors duration-200 group-hover:border-border/70">
        <div className="flex items-center gap-1.5 border-border/50 border-b bg-gradient-to-r from-background/50 to-transparent px-3 py-2">
          <div className="size-2 rounded-full bg-red-500/70 transition-colors duration-200 group-hover:bg-red-500/90" />
          <div className="size-2 rounded-full bg-yellow-500/70 transition-colors duration-200 group-hover:bg-yellow-500/90" />
          <div className="size-2 rounded-full bg-green-500/70 transition-colors duration-200 group-hover:bg-green-500/90" />
        </div>
        <div className="relative h-20 overflow-hidden">
          <pre className="h-full overflow-hidden p-2 font-mono text-xs">
            <code className="line-clamp-4 whitespace-pre-wrap text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
              {stripFrontmatter(prompt.content)}
            </code>
          </pre>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-muted to-transparent" />
        </div>
      </div>

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <PromptCellSource prompt={prompt} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 tabular-nums">
            <DownloadIcon className="size-3 transition-colors duration-200 group-hover:text-foreground/60" />
            <span className="transition-colors duration-200 group-hover:text-foreground/60">
              {downloads.toLocaleString()}
            </span>
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
