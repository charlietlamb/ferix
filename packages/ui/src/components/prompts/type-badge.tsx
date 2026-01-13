"use client";

import { Badge } from "@ferix/ui/components/ui/badge";

interface TypeBadgeProps {
  type: "subagent" | "rule";
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return <Badge variant="outline">{type}</Badge>;
}
