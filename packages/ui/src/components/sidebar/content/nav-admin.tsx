"use client";

import { Link } from "@ferix/i18n/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ferix/ui/components/ui/sidebar";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { ShieldIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function NavAdmin() {
  const t = useTranslations("sidebar");
  const { isAdmin } = useAuthenticated();

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("admin")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/admin" />}>
              <ShieldIcon className="size-4" />
              <span>{t("adminDashboard")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
