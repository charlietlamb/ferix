"use client";

import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { SidebarFooterSkeleton } from "./sidebar-footer-skeleton";
import { SidebarFooterUnauthenticated } from "./sidebar-footer-unauthenticated";
import { SidebarFooterUserMenu } from "./sidebar-footer-user-menu";

export function AppSidebarFooter() {
  const { user, isPending } = useAuthenticated();

  if (isPending) {
    return <SidebarFooterSkeleton />;
  }

  if (user) {
    return <SidebarFooterUserMenu user={user} />;
  }

  return <SidebarFooterUnauthenticated />;
}
