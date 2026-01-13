import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function PromptCellSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="size-4" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded border border-border/50 bg-black/20">
        <div className="flex items-center gap-1.5 border-border/50 border-b px-3 py-2">
          <div className="size-2 rounded-full bg-red-500/60" />
          <div className="size-2 rounded-full bg-yellow-500/60" />
          <div className="size-2 rounded-full bg-green-500/60" />
        </div>
        <div className="h-20 space-y-2 p-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="size-4" />
        </div>
      </div>
    </div>
  );
}
