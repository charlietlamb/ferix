"use client";

import { cn } from "@ferix/ui/lib/utils";
import type { ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function PromptDetailSection({
  title,
  children,
  className,
}: SidebarSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-border border-b pb-4",
        className
      )}
    >
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
