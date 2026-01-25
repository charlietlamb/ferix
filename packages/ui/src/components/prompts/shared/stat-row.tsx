"use client";

import { cn } from "@ferix/ui/lib/utils";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface StatRowProps {
  icon: Icon;
  value: ReactNode;
  label?: string;
  /** If true, shows label before value (for dates). Default: false (value before label) */
  labelFirst?: boolean;
  className?: string;
}

export function StatRow({
  icon: IconComponent,
  value,
  label,
  labelFirst = false,
  className,
}: StatRowProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <IconComponent className="size-4 text-muted-foreground" />
      {labelFirst ? (
        <>
          {label && <span className="text-muted-foreground">{label}</span>}
          <span>{value}</span>
        </>
      ) : (
        <>
          <span>{value}</span>
          {label && <span className="text-muted-foreground">{label}</span>}
        </>
      )}
    </div>
  );
}
