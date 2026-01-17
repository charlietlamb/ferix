import { tags } from "@ferix/ui/lib/tags";
import type { CommandItemData, CommandSource } from "../types";

export const tagsSource: CommandSource = {
  id: "tags",
  label: "Tags",
  priority: 50,
  getItems: (query: string): CommandItemData[] => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return tags.slice(0, 6).map((tag) => ({
        id: `tag-${tag.id}`,
        type: "tag",
        label: tag.label,
        description: tag.category,
        icon: tag.icon,
        path: `/tag/${tag.id}`,
      }));
    }

    return tags
      .filter((tag) => {
        const matchesLabel = tag.label.toLowerCase().includes(normalizedQuery);
        const matchesId = tag.id.toLowerCase().includes(normalizedQuery);
        const matchesCategory = tag.category
          .toLowerCase()
          .includes(normalizedQuery);
        return matchesLabel || matchesId || matchesCategory;
      })
      .slice(0, 8)
      .map((tag) => ({
        id: `tag-${tag.id}`,
        type: "tag",
        label: tag.label,
        description: tag.category,
        icon: tag.icon,
        path: `/tag/${tag.id}`,
      }));
  },
};
