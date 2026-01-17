"use client";

import { cn } from "@ferix/ui/lib/utils";
import type { ComponentType } from "react";

interface CreateMenuCellProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
}

export function CreateMenuCell({
  title,
  description,
  icon: Icon,
  onClick,
  className,
}: CreateMenuCellProps) {
  return (
    <button
      className={cn(
        "flex flex-col items-start gap-3 p-6 text-left transition-colors hover:bg-muted/50",
        className
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-8 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground text-sm">{description}</span>
      </div>
    </button>
  );
}
