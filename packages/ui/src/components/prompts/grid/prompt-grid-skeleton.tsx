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
            "-mr-px grid grid-cols-1 border-border border-t md:grid-cols-2 lg:grid-cols-3",
            className
          )}
        >
          {Array.from({ length: count }).map((_, i) => (
            <div className="border-border border-r border-b" key={i}>
              <PromptCellSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
