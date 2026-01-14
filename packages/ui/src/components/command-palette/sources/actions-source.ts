import { GearIcon, MoonIcon, PlusIcon } from "@phosphor-icons/react";
import type { CommandItemData, CommandSource } from "../types";

const actions: (CommandItemData & { keywords?: string[] })[] = [
  {
    id: "action-create-prompt",
    type: "action",
    labelKey: "actionsCreatePrompt",
    icon: PlusIcon,
    action: "createPromptDialog",
    keywords: ["new", "add", "create"],
  },
  {
    id: "action-settings",
    type: "action",
    labelKey: "actionsSettings",
    icon: GearIcon,
    action: "settingsDialog",
    keywords: ["preferences", "config"],
  },
  {
    id: "action-toggle-theme",
    type: "action",
    labelKey: "actionsToggleTheme",
    icon: MoonIcon,
    action: "toggleTheme",
    keywords: ["dark", "light", "mode"],
  },
];

export const actionsSource: CommandSource = {
  id: "actions",
  label: "Actions",
  priority: 30,
  getItems: (query: string): CommandItemData[] => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return actions;
    }

    return actions.filter((action) => {
      const matchesLabel = action.labelKey
        ?.toLowerCase()
        .includes(normalizedQuery);
      const matchesKeywords = action.keywords?.some((k) =>
        k.toLowerCase().includes(normalizedQuery)
      );
      return matchesLabel || matchesKeywords;
    });
  },
};
