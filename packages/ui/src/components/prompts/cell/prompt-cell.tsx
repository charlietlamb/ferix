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
      className="group relative flex h-full w-full flex-col gap-3 p-4 text-left transition-all duration-200 ease-out hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.03]"
      href={`/prompt/${prompt.slug}`}
    >
      {/* Subtle hover glow effect */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {firstTag ? (
            <TypeIcon
              className="text-foreground/70 transition-colors duration-150 group-hover:text-foreground"
              size={16}
            />
          ) : (
            <TypeIcon className="size-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground/70" />
          )}
          <span className="line-clamp-1 font-medium text-foreground/90 text-sm transition-colors duration-150 group-hover:text-foreground">
            {prompt.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TypeBadge type={prompt.type} />
          <button
            className="rounded p-0.5 transition-all duration-150 hover:bg-foreground/5"
            onClick={handleCopy}
            type="button"
          >
            {copied ? (
              <CheckIcon className="size-4 text-green-500" />
            ) : (
              <CopyIcon className="size-4 text-muted-foreground opacity-0 transition-all duration-150 hover:text-foreground group-hover:opacity-100" />
            )}
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 overflow-hidden rounded border border-foreground/[0.06] bg-foreground/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 group-hover:border-foreground/10 group-hover:bg-foreground/[0.03] group-hover:shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] dark:border-foreground/[0.08] dark:bg-foreground/[0.03] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:group-hover:border-foreground/12 dark:group-hover:bg-foreground/[0.05] dark:group-hover:shadow-[inset_0_1px_4px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-1.5 border-foreground/[0.06] border-b bg-foreground/[0.01] px-3 py-1.5 dark:border-foreground/[0.08] dark:bg-foreground/[0.02]">
          <div className="size-2 rounded-full bg-foreground/15 transition-colors duration-200 group-hover:bg-red-500/60" />
          <div className="size-2 rounded-full bg-foreground/15 transition-colors duration-200 group-hover:bg-yellow-500/60" />
          <div className="size-2 rounded-full bg-foreground/15 transition-colors duration-200 group-hover:bg-green-500/60" />
        </div>
        <div className="relative">
          <pre className="h-20 overflow-hidden p-3 font-mono text-[11px] leading-relaxed tracking-tight">
            <code className="line-clamp-4 whitespace-pre-wrap text-foreground/45 transition-colors duration-200 group-hover:text-foreground/55">
              {stripFrontmatter(prompt.content)}
            </code>
          </pre>
          {/* Fade overlay to indicate overflow */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-foreground/[0.02] to-transparent transition-colors duration-200 group-hover:from-foreground/[0.03] dark:from-foreground/[0.03] dark:group-hover:from-foreground/[0.05]" />
        </div>
      </div>

      <div className="flex items-center justify-between text-foreground/50 text-xs transition-colors duration-150 group-hover:text-foreground/60">
        <PromptCellSource prompt={prompt} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <DownloadIcon className="size-3" />
            <span className="tabular-nums">{downloads.toLocaleString()}</span>
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
