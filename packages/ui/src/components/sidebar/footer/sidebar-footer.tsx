"use client";

import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { FooterSkeleton } from "./footer-skeleton";
import { FooterUnauthenticated } from "./footer-unauthenticated";
import { UserMenu } from "./user-menu/user-menu";

export function SidebarFooterContent() {
  const { user, isPending } = useAuthenticated();

  if (isPending) {
    return <FooterSkeleton />;
  }

  if (user) {
    return <UserMenu user={user} />;
  }

  return <FooterUnauthenticated />;
}
