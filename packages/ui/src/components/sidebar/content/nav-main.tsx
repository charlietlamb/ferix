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
import {
  ClockIcon,
  FireIcon,
  FolderIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

interface NavItem {
  titleKey: "popular" | "recent" | "tags" | "directories";
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { titleKey: "popular", href: "/popular", icon: FireIcon },
  { titleKey: "recent", href: "/recent", icon: ClockIcon },
  { titleKey: "tags", href: "/tags", icon: TagIcon },
  { titleKey: "directories", href: "/directories", icon: FolderIcon },
];

export function NavMain() {
  const t = useTranslations("sidebar");

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("browse")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.titleKey}>
              <SidebarMenuButton render={<Link href={item.href} />}>
                <item.icon className="size-4" />
                <span>{t(item.titleKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
