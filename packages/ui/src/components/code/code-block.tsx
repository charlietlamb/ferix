"use client";

import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

interface CodeBlockProps {
  code: string;
  className?: string;
  bordered?: boolean;
}

export function CodeBlock({
  code,
  className,
  bordered = true,
}: CodeBlockProps) {
  const { copy, copied } = useCopy();

  return (
    <div
      className={cn(
        "group h-full overflow-hidden bg-muted",
        bordered && "border border-border",
        className
      )}
    >
      <div className="flex items-center justify-between border-border border-b px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-red-500/60" />
          <div className="size-2 rounded-full bg-yellow-500/60" />
          <div className="size-2 rounded-full bg-green-500/60" />
        </div>
        <button
          className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          onClick={() => copy(code)}
          type="button"
        >
          {copied ? (
            <CheckIcon className="size-4 text-green-500" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs">
        <code className="whitespace-pre-wrap text-muted-foreground">
          {code}
        </code>
      </pre>
    </div>
  );
}
