"use client";

import { Link, usePathname } from "@ferix/i18n/navigation";
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
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function NavPersonal() {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthenticated();

  if (!(isAuthenticated && user)) {
    return null;
  }

  const username = (user as { username?: string | null }).username;

  if (!username) {
    return null;
  }

  const userProfilePath = `/user/${username}`;
  const isOnUserProfile = pathname === userProfilePath;
  const currentTab = searchParams.get("tab");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("personal")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isOnUserProfile && currentTab !== "saved"}
              render={<Link href={userProfilePath} />}
            >
              <UserIcon className="size-4" />
              <span>{t("myProfile")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isOnUserProfile && currentTab === "saved"}
              render={<Link href={`${userProfilePath}?tab=saved`} />}
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
