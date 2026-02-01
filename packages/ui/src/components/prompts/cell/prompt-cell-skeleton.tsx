import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function PromptCellSkeleton() {
  return (
    <div className="shimmer flex h-full w-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="size-4 rounded" />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded border border-border/50 bg-muted">
        <div className="flex items-center gap-1.5 border-border/50 border-b bg-gradient-to-r from-background/50 to-transparent px-3 py-2">
          <div className="size-2 rounded-full bg-red-500/40" />
          <div className="size-2 rounded-full bg-yellow-500/40" />
          <div className="size-2 rounded-full bg-green-500/40" />
        </div>
        <div className="relative h-20 overflow-hidden">
          <div className="space-y-2 p-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-muted to-transparent" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="size-4 rounded" />
        </div>
      </div>
    </div>
  );
}
