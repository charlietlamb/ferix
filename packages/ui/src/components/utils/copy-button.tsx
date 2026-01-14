"use client";

import { api } from "@ferix/server/_generated/api";
import type { Id } from "@ferix/server/_generated/dataModel";
import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import type { Icon } from "@phosphor-icons/react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useMutation } from "convex/react";

interface CopyButtonProps {
  content: string;
  promptId?: Id<"prompts">;
  onCopy?: () => void;
  showOnHover?: boolean;
  className?: string;
  icon?: Icon;
}

export function CopyButton({
  content,
  promptId,
  onCopy,
  showOnHover,
  className,
  icon: IconComponent,
}: CopyButtonProps) {
  const { copy, copied } = useCopy();
  const recordDownload = useMutation(api.prompts.recordDownload);
  const DefaultIcon = IconComponent ?? CopyIcon;

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
        <DefaultIcon
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
