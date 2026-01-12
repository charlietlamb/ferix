"use client";

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
import {
  DownloadIcon,
  GavelIcon,
  UserRectangleIcon,
} from "@phosphor-icons/react";

interface PromptCardProps {
  title: string;
  type: "subagent" | "rule";
  content: string;
  downloads: number;
  creator: {
    name: string;
    image: string | null;
  } | null;
}

const typeIcons = {
  subagent: UserRectangleIcon,
  rule: GavelIcon,
};

export function PromptCard({
  title,
  type,
  content,
  downloads,
  creator,
}: PromptCardProps) {
  const TypeIcon = typeIcons[type];

  return (
    <Card className="group flex h-full flex-col py-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
            <CardTitle className="line-clamp-1">{title}</CardTitle>
          </div>
          <span className="shrink-0 rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
            {type}
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
                {content}
              </code>
            </pre>
            <CopyButton
              className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
              value={content}
            />
          </div>
        </div>

        <div className="mt-auto pt-3">
          <Separator className="mb-3" />
          <div className="flex items-center justify-between">
            {creator && (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  {creator.image && (
                    <AvatarImage alt={creator.name} src={creator.image} />
                  )}
                  <AvatarFallback>
                    {creator.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-24 truncate text-muted-foreground text-xs">
                  {creator.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <DownloadIcon className="size-3.5" />
              <span>{downloads.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
