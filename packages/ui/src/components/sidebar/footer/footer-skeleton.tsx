import { SidebarMenu, SidebarMenuItem } from "@ferix/ui/components/ui/sidebar";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function FooterSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 w-full items-center gap-2 rounded-md px-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
