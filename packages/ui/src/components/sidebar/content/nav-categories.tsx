"use client";

import { Link } from "@ferix/i18n/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ferix/ui/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ferix/ui/components/ui/sidebar";
import { getTagsByIds } from "@ferix/ui/lib/tags";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

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

export function NavCategories() {
  const t = useTranslations("sidebar");
  const categories = getTagsByIds(TOP_CATEGORY_IDS);

  return (
    <SidebarGroup>
      <Collapsible className="group/collapsible" defaultOpen>
        <SidebarGroupLabel
          render={
            <CollapsibleTrigger className="flex w-full items-center justify-between" />
          }
        >
          {t("topCategories")}
          <CaretDownIcon className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((tag) => {
                const Icon = tag.icon;
                return (
                  <SidebarMenuItem key={tag.id}>
                    <SidebarMenuButton
                      render={<Link href={`/tag/${tag.id}`} />}
                    >
                      <Icon size={16} />
                      <span>{tag.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
