import { ClockIcon, FireIcon, HouseIcon } from "@phosphor-icons/react";
import type { CommandItemData, CommandSource } from "../types";

const pages: CommandItemData[] = [
  {
    id: "page-home",
    type: "page",
    label: "Home",
    path: "/",
    icon: HouseIcon,
  },
  {
    id: "page-popular",
    type: "page",
    label: "Popular",
    path: "/popular",
    icon: FireIcon,
  },
  {
    id: "page-recent",
    type: "page",
    label: "Recent",
    path: "/recent",
    icon: ClockIcon,
  },
];

export const pagesSource: CommandSource = {
  id: "pages",
  label: "Pages",
  priority: 60,
  getItems: (query: string): CommandItemData[] => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return pages;
    }

    return pages.filter((page) =>
      page.label?.toLowerCase().includes(normalizedQuery)
    );
  },
};
