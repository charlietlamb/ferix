import { PromptCellSkeleton } from "./prompt-cell-skeleton";

interface PromptGridSkeletonProps {
  count?: number;
}

export function PromptGridSkeleton({ count = 12 }: PromptGridSkeletonProps) {
  return (
    <div className="scrollbar-minimal h-full overflow-auto">
      <div className="overflow-hidden">
        <div className="-mr-px grid grid-cols-1 border-border border-t md:grid-cols-2 lg:grid-cols-3">
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
