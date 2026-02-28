"use client";

import { Skeleton } from "@ferix/ui/components/ui/skeleton";

function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between border-border border-b px-4 py-2">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-3 w-20" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            className="flex flex-col gap-3 rounded-md border border-border p-4"
            key={i}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarSectionSkeleton({
  children,
  border = true,
}: {
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 p-4 ${border ? "border-border border-b" : ""}`}
    >
      <Skeleton className="h-3 w-20" />
      {children}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="flex flex-col overflow-auto border-border border-t md:w-[320px] md:shrink-0 md:border-t-0 md:border-l">
      <SidebarSectionSkeleton>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </SidebarSectionSkeleton>
      <SidebarSectionSkeleton border={false}>
        <Skeleton className="h-9 w-full rounded-md" />
      </SidebarSectionSkeleton>
    </aside>
  );
}

export function McpDetailSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <HeaderSkeleton />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex-1 overflow-y-auto">
          <ContentSkeleton />
        </div>
        <SidebarSkeleton />
      </div>
    </div>
  );
}
