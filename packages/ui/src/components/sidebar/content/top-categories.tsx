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
import { getTagsByIds } from "@ferix/ui/lib/tags";

const TOP_CATEGORY_IDS = [
  "typescript",
  "nextjs",
  "react",
  "drizzle",
  "prisma",
  "tailwindcss",
  "python",
  "rust",
];

export function TopCategories() {
  const topTags = getTagsByIds(TOP_CATEGORY_IDS);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Top Categories</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {topTags.map((tag) => {
            const Icon = tag.icon;
            return (
              <SidebarMenuItem key={tag.id}>
                <SidebarMenuButton render={<Link href={`/tag/${tag.id}`} />}>
                  <Icon color="default" size={16} />
                  <span>{tag.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
