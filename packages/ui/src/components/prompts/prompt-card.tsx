"use client";

import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ferix/ui/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ferix/ui/components/ui/card";
import { CopyButton } from "@ferix/ui/components/ui/copy-button";
import { Separator } from "@ferix/ui/components/ui/separator";
import { getTagById } from "@ferix/ui/lib/tags";
import {
  DownloadIcon,
  GavelIcon,
  UserRectangleIcon,
} from "@phosphor-icons/react";
import { useMutation } from "convex/react";

interface PromptCardProps {
  prompt: Prompt;
}

const typeIcons = {
  subagent: UserRectangleIcon,
  rule: GavelIcon,
};

export function PromptCard({ prompt }: PromptCardProps) {
  const recordDownload = useMutation(api.prompts.recordDownload);
  const firstTagId = prompt.tags[0];
  const firstTag = firstTagId ? getTagById(firstTagId) : null;
  const TypeIcon = firstTag?.icon ?? typeIcons[prompt.type];

  return (
    <Card className="group flex h-full flex-col py-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {firstTag ? (
              <TypeIcon color="default" size={16} />
            ) : (
              <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            <CardTitle className="line-clamp-1 font-normal">
              {prompt.title}
            </CardTitle>
          </div>
          <span className="shrink-0 rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
            {prompt.type}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 overflow-hidden rounded-lg border border-border/50 bg-black/20">
          <div className="flex items-center gap-1.5 border-border/50 border-b px-3 py-2">
            <div className="size-2 rounded-full bg-red-500/60" />
            <div className="size-2 rounded-full bg-yellow-500/60" />
            <div className="size-2 rounded-full bg-green-500/60" />
          </div>

          <div className="relative">
            <pre className="scrollbar-minimal h-28 overflow-y-auto p-3 font-mono text-xs">
              <code className="wrap-break-word whitespace-pre-wrap text-muted-foreground">
                {prompt.content}
              </code>
            </pre>
            <CopyButton
              className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
              onCopy={() => recordDownload({ promptId: prompt._id })}
              value={prompt.content}
            />
          </div>
        </div>

        <div className="mt-auto pt-3">
          <Separator className="mb-3" />
          <div className="flex items-center justify-between">
            {prompt.creator && (
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
                <span className="max-w-24 truncate text-muted-foreground text-xs">
                  {prompt.creator.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <DownloadIcon className="size-3.5" />
              <span>{prompt.downloads.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
