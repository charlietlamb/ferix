"use client";

import { Link, usePathname } from "@ferix/i18n/navigation";
import { Badge } from "@ferix/ui/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ferix/ui/components/ui/sidebar";
import {
  ArrowsClockwiseIcon,
  ClockIcon,
  FireIcon,
  FolderIcon,
  TagIcon,
  TerminalIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

interface NavItem {
  titleKey: "popular" | "recent" | "tags" | "repositories" | "code" | "sync";
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: "new";
}

const navItems: NavItem[] = [
  { titleKey: "code", href: "/code", icon: TerminalIcon, badge: "new" },
  { titleKey: "sync", href: "/sync", icon: ArrowsClockwiseIcon, badge: "new" },
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
                <span className="flex-1">{t(item.titleKey)}</span>
                {item.badge && (
                  <Badge className="h-4 bg-foreground px-1.5 text-[10px] text-background">
                    {t(item.badge)}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
