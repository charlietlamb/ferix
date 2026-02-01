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
      className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      variant="outline"
    >
      {config.label}
    </Badge>
  );
}
