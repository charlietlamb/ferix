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
import {
  ClockIcon,
  FireIcon,
  FolderIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

interface NavItem {
  titleKey: "popular" | "recent" | "tags" | "repositories";
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { titleKey: "popular", href: "/popular", icon: FireIcon },
  { titleKey: "recent", href: "/recent", icon: ClockIcon },
  { titleKey: "tags", href: "/tags", icon: TagIcon },
  { titleKey: "repositories", href: "/repositories", icon: FolderIcon },
];

export function NavMain() {
  const t = useTranslations("sidebar");
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("browse")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.titleKey}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                render={<Link href={item.href} />}
              >
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
