import { PageHeader } from "@ferix/ui/components/layout/page-header";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function UserProfileHeaderSkeleton() {
  return (
    <PageHeader className="flex flex-row items-stretch justify-between border-border border-b p-0">
      <div className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex items-stretch">
        <div className="flex flex-col justify-center border-border border-l px-4">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="mt-1 h-3 w-16" />
        </div>
        <div className="flex flex-col justify-center border-border border-l px-4">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>
      </div>
    </PageHeader>
  );
}
