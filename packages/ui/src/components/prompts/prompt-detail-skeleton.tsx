"use client";

import { AppPage } from "@ferix/ui/components/layout/app-page";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function PromptDetailSkeleton() {
  return (
    <AppPage>
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="size-8" />
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 lg:flex-row">
        {/* Content skeleton (70%) */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:w-[70%]">
          <Skeleton className="h-[400px] w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Sidebar skeleton (30%) */}
        <aside className="flex flex-col gap-4 lg:w-[30%]">
          {/* Author section */}
          <div className="flex flex-col gap-2 border-border border-b pb-4">
            <Skeleton className="h-3 w-16" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Stats section */}
          <div className="flex flex-col gap-2 border-border border-b pb-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Details section */}
          <div className="flex flex-col gap-2 border-border border-b pb-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Tags section */}
          <div className="flex flex-col gap-2 border-border border-b pb-4">
            <Skeleton className="h-3 w-10" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Actions section */}
          <div className="flex flex-col gap-2 pb-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>
      </div>
    </AppPage>
  );
}
