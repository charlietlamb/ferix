"use client";

import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import { CheckIcon, CopyIcon, TerminalIcon } from "@phosphor-icons/react";
import { cva } from "class-variance-authority";

const terminalCommandVariants = cva(
  "flex cursor-pointer items-center transition-opacity hover:opacity-80",
  {
    variants: {
      variant: {
        hero: "gap-4 bg-muted/20 p-6 font-mono text-foreground",
        compact: "group relative gap-2 overflow-x-auto bg-muted p-4",
      },
    },
    defaultVariants: {
      variant: "compact",
    },
  }
);

const iconVariants = cva("shrink-0 text-muted-foreground", {
  variants: {
    variant: {
      hero: "size-6",
      compact: "size-4",
    },
  },
});

const codeVariants = cva("flex-1 text-left", {
  variants: {
    variant: {
      hero: "truncate text-lg md:text-xl",
      compact: "font-mono text-sm",
    },
  },
});

const copyIconVariants = cva("ml-auto shrink-0 text-muted-foreground", {
  variants: {
    variant: {
      hero: "size-6",
      compact: "size-4",
    },
  },
});

interface TerminalCommandProps {
  command: string;
  variant?: "hero" | "compact";
}

export function TerminalCommand({
  command,
  variant = "compact",
}: TerminalCommandProps) {
  const { copy, copied } = useCopy();

  return (
    <button
      className={cn(terminalCommandVariants({ variant }))}
      onClick={() => copy(command)}
      type="button"
    >
      <TerminalIcon className={cn(iconVariants({ variant }))} />
      <code className={cn(codeVariants({ variant }))}>{command}</code>
      {copied ? (
        <CheckIcon
          className={cn(copyIconVariants({ variant }), "text-green-500")}
        />
      ) : (
        <CopyIcon className={cn(copyIconVariants({ variant }))} />
      )}
    </button>
  );
}
