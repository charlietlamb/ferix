"use client";

import { cn } from "@ferix/ui/lib/utils";
import type { ReactNode } from "react";

interface PromptSectionProps {
  title: string;
  children: ReactNode;
  /** Whether to show bottom border (default: true) */
  border?: boolean;
}

export function PromptSection({
  title,
  children,
  border = true,
}: PromptSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4",
        border && "border-border border-b"
      )}
    >
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}
