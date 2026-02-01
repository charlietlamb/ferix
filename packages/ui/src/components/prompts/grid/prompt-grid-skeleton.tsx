import { PromptCellSkeleton } from "@ferix/ui/components/prompts/cell/prompt-cell-skeleton";
import { cn } from "@ferix/ui/lib/utils";

interface PromptGridSkeletonProps {
  count?: number;
  className?: string;
}

export function PromptGridSkeleton({
  count = 12,
  className,
}: PromptGridSkeletonProps) {
  return (
    <div className="scrollbar-none h-full overflow-auto">
      <div className="overflow-hidden">
        <div
          className={cn(
            "-mr-px grid grid-cols-1 border-foreground/[0.06] border-t md:grid-cols-2 lg:grid-cols-3 dark:border-foreground/[0.08]",
            className
          )}
        >
          {Array.from({ length: count }).map((_, i) => (
            <div
              className="border-foreground/[0.06] border-r border-b dark:border-foreground/[0.08]"
              key={i}
            >
              <PromptCellSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
