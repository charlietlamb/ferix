"use client";

import { Button } from "@ferix/ui/components/ui/button";
import { useCopy } from "@ferix/ui/hooks/use-copy";
import { cn } from "@ferix/ui/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

type CopyButtonSize = "xs" | "sm" | "md" | "lg";

const SIZE_CONFIG = {
  xs: { button: "icon-xs", icon: "size-3" },
  sm: { button: "icon-sm", icon: "size-4" },
  md: { button: "icon-sm", icon: "size-5" },
  lg: { button: "icon-lg", icon: "size-6" },
} as const;

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: CopyButtonSize;
  onCopy?: () => void;
}

export function CopyButton({
  value,
  className,
  size = "xs",
  onCopy,
}: CopyButtonProps) {
  const { copied, copy } = useCopy();
  const config = SIZE_CONFIG[size];

  return (
    <Button
      className={cn(className)}
      onClick={() => {
        if (!copied) {
          onCopy?.();
        }
        copy(value);
      }}
      size={config.button}
      variant="ghost"
    >
      {copied ? (
        <CheckIcon className={cn(config.icon, "text-green-500")} />
      ) : (
        <CopyIcon className={config.icon} />
      )}
    </Button>
  );
}
