"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function PromptDetailSkeleton() {
  return (
    <AppPage>
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Content - left side */}
        <div className="flex min-h-[400px] flex-1 flex-col md:min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between border-border border-b p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="size-8" />
          </div>

          {/* Editor toolbar */}
          <div className="flex items-center justify-between border-border border-b px-4 py-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>

          {/* Textarea */}
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>

        {/* Sidebar - right side */}
        <aside className="flex flex-col border-border border-t md:w-[320px] md:shrink-0 md:overflow-auto md:border-t-0 md:border-l">
          {/* Author */}
          <div className="flex flex-col gap-2 border-border border-b p-4">
            <Skeleton className="h-3 w-16" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-2 border-border border-b p-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Dates */}
          <div className="flex flex-col gap-2 border-border border-b p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2 border-border border-b p-4">
            <Skeleton className="h-3 w-10" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>
      </div>
    </AppPage>
  );
}
