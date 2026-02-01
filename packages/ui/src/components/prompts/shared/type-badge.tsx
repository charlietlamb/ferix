"use client";

import { Badge } from "@ferix/ui/components/ui/badge";
import {
  getPromptTypeConfig,
  type PromptType,
} from "@ferix/ui/lib/prompt-types";

interface TypeBadgeProps {
  type: PromptType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = getPromptTypeConfig(type);
  return (
    <Badge
      className="border-foreground/[0.08] bg-foreground/[0.02] text-foreground/60 transition-colors duration-150 group-hover:border-foreground/12 group-hover:bg-foreground/[0.04] group-hover:text-foreground/70 dark:border-foreground/10 dark:bg-foreground/[0.04] dark:text-foreground/50 dark:group-hover:border-foreground/15 dark:group-hover:bg-foreground/[0.06] dark:group-hover:text-foreground/60"
      variant="outline"
    >
      {config.label}
    </Badge>
  );
}
