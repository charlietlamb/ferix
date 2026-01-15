"use client";

import type { Directory } from "@ferix/ui/lib/directories";
import { cn } from "@ferix/ui/lib/utils";

interface DirectoryItemProps {
  directory: Directory;
  className?: string;
}

/**
 * Displays a directory with its icon (light/dark mode aware) and name.
 */
export function DirectoryItem({ directory, className }: DirectoryItemProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {/* biome-ignore lint: public svg */}
      <img
        alt={directory.name}
        className="size-4 object-contain dark:hidden"
        height={16}
        src={directory.lightImageUrl}
        width={16}
      />
      {/* biome-ignore lint: public svg */}
      <img
        alt={directory.name}
        className="hidden size-4 object-contain dark:block"
        height={16}
        src={directory.darkImageUrl}
        width={16}
      />
      {directory.name}
    </span>
  );
}
