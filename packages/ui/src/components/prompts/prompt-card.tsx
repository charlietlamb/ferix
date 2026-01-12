"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ferix/ui/components/ui/card";
import { CopyButton } from "@ferix/ui/components/ui/copy-button";
import { DownloadIcon } from "@phosphor-icons/react";

interface PromptCardProps {
  title: string;
  type: "subagent" | "rule";
  content: string;
  downloads: number;
}

export function PromptCard({
  title,
  type,
  content,
  downloads,
}: PromptCardProps) {
  return (
    <Card className="h-full gap-3 py-4" size="sm">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="line-clamp-1 text-sm">{title}</CardTitle>
        <span className="shrink-0 text-muted-foreground text-xs">{type}</span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <pre className="scrollbar-minimal relative max-h-32 overflow-y-auto rounded-md bg-muted/50 p-2 font-mono text-xs">
          <CopyButton className="absolute top-1 right-1" value={content} />
          <code className="wrap-break-word whitespace-pre-wrap text-muted-foreground">
            {content}
          </code>
        </pre>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <DownloadIcon className="size-3" />
          <span>{downloads}</span>
        </div>
      </CardContent>
    </Card>
  );
}
