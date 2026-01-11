import { SidebarMenu, SidebarMenuItem } from "@ferix/ui/components/ui/sidebar";
import { Skeleton } from "@ferix/ui/components/ui/skeleton";

export function FooterSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 items-center gap-2 rounded-md px-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
