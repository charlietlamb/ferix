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
import { BookmarkIcon, UserIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export function NavPersonal() {
  const t = useTranslations("sidebar");
  const { user, isAuthenticated } = useAuthenticated();

  if (!(isAuthenticated && user)) {
    return null;
  }

  const username = (user as { username?: string | null }).username;

  if (!username) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("personal")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={`/user/${username}`} />}>
              <UserIcon className="size-4" />
              <span>{t("myProfile")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={`/user/${username}?tab=saved`} />}
            >
              <BookmarkIcon className="size-4" />
              <span>{t("saved")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
