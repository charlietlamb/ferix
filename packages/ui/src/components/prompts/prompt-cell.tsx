"use client";

import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import { getTagById } from "@ferix/ui/lib/tags";
import {
  BookmarkSimpleIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  GavelIcon,
  UserRectangleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useState } from "react";

interface PromptCellProps {
  prompt: Prompt;
}

const typeIcons = {
  subagent: UserRectangleIcon,
  rule: GavelIcon,
};

export function PromptCell({ prompt }: PromptCellProps) {
  const recordDownload = useMutation(api.prompts.recordDownload);
  const toggleSave = useMutation(api.prompts.toggleSave);
  const { copy, copied } = useCopy();
  const { isAuthenticated } = useAuthenticated();
  const { open: openDialog } = useDialog();
  const firstTagId = prompt.tags[0];
  const firstTag = firstTagId ? getTagById(firstTagId) : null;
  const TypeIcon = firstTag?.icon ?? typeIcons[prompt.type];

  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [optimisticDownloads, setOptimisticDownloads] = useState<number | null>(
    null
  );
  const isSaved = optimisticSaved ?? prompt.isSaved;
  const downloads = optimisticDownloads ?? prompt.downloads;

  const handleClick = () => {
    if (!copied) {
      setOptimisticDownloads(prompt.downloads + 1);
      recordDownload({ promptId: prompt._id });
      copy(prompt.content);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openDialog("signInDialog");
      return;
    }
    setOptimisticSaved(!isSaved);
    toggleSave({ promptId: prompt._id });
  };

  return (
    <div className="group flex h-full w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/50">
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
          <span className="shrink-0 rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
            {prompt.type}
          </span>
          <button onClick={handleClick} type="button">
            {copied ? (
              <CheckIcon className="size-4 text-green-500" />
            ) : (
              <CopyIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </button>
        </div>
      </div>

      <div className="w-full flex-1 overflow-hidden rounded border border-border/50 bg-black/20">
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
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {prompt.creator.image && (
                <AvatarImage
                  alt={prompt.creator.name}
                  src={prompt.creator.image}
                />
              )}
              <AvatarFallback>
                {prompt.creator.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-20 truncate">{prompt.creator.name}</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <DownloadIcon className="size-3" />
            <span>{downloads.toLocaleString()}</span>
          </div>
          <button
            className="cursor-pointer hover:text-foreground"
            onClick={handleSave}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSave(e as unknown as React.MouseEvent)
            }
            tabIndex={0}
            type="button"
          >
            <BookmarkSimpleIcon
              className="size-4"
              weight={isSaved ? "fill" : "regular"}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
