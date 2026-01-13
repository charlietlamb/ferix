"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";

interface CopyButtonProps {
  content: string;
  promptId?: Id<"prompts">;
  onCopy?: () => void;
  showOnHover?: boolean;
  className?: string;
}

export function CopyButton({
  content,
  promptId,
  onCopy,
  showOnHover,
  className,
}: CopyButtonProps) {
  const { copy, copied } = useCopy();
  const recordDownload = useMutation(api.prompts.recordDownload);

  const handleCopy = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!copied) {
      if (promptId) {
        recordDownload({ promptId });
      }
      copy(content);
      onCopy?.();
    }
  };

  return (
    <Button
      className={className}
      onClick={handleCopy}
      size="icon"
      variant="ghost"
    >
      {copied ? (
        <CheckIcon className="size-4 text-green-500" />
      ) : (
        <CopyIcon
          className={cn(
            "size-4",
            showOnHover &&
              "text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          )}
        />
      )}
    </Button>
  );
}
