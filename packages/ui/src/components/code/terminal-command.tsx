"use client";

import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import { CheckIcon, CopySimpleIcon, TerminalIcon } from "@phosphor-icons/react";

interface TerminalCommandProps {
  command: string;
  variant?: "hero" | "compact";
}

export function TerminalCommand({
  command,
  variant = "compact",
}: TerminalCommandProps) {
  const { copy, copied } = useCopy();

  const handleCopy = () => {
    copy(command);
  };

  if (variant === "hero") {
    return (
      <div className="border-border border-b bg-muted/20 p-6">
        <button
          className="flex w-full items-center justify-between gap-4 font-mono text-foreground transition-opacity hover:opacity-80"
          onClick={handleCopy}
          type="button"
        >
          <div className="flex items-center gap-3">
            <TerminalIcon className="size-6 text-foreground/60" />
            <code className="text-lg md:text-xl">{command}</code>
          </div>
          <span className="flex size-6 shrink-0 items-center justify-center">
            {copied ? (
              <CheckIcon className="size-6 text-green-400" />
            ) : (
              <CopySimpleIcon className="size-6 text-foreground/60" />
            )}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="group relative">
      <pre className="flex items-center gap-2 overflow-x-auto bg-muted p-4">
        <TerminalIcon className="size-4 shrink-0" />
        <code className="font-mono text-sm">{command}</code>
      </pre>
      <button
        className={cn(
          "absolute top-2 right-2 rounded-md p-2 opacity-0 transition-opacity group-hover:opacity-100",
          "hover:bg-muted-foreground/10"
        )}
        onClick={handleCopy}
        type="button"
      >
        <span className="flex size-4 items-center justify-center">
          {copied ? (
            <CheckIcon className="size-4 text-green-500" />
          ) : (
            <CopySimpleIcon className="size-4 text-muted-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}
