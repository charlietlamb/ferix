"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

interface CopyButtonProps {
  value: string;
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({ value, className, onCopy }: CopyButtonProps) {
  const { copied, copy } = useCopy();

  return (
    <Button
      className={cn(className)}
      onClick={() => {
        if (!copied) {
          onCopy?.();
        }
        copy(value);
      }}
      size="icon-xs"
      variant="ghost"
    >
      {copied ? (
        <CheckIcon className="size-3" />
      ) : (
        <CopyIcon className="size-3" />
      )}
    </Button>
  );
}
