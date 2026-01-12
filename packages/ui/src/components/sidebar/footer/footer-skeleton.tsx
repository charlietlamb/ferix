import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function FooterSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="size-6 rounded-full" />
    </div>
  );
}
