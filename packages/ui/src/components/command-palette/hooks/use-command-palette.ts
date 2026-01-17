"use client";

import { useMemo } from "react";
import { commandSources } from "../sources";
import type { CommandGroup, CommandItemData } from "../types";

export function useCommandPalette(
  promptItems: CommandItemData[] | undefined,
  syncDirectoryItems: CommandItemData[] | undefined,
  directorySearchItems: CommandItemData[] | undefined,
  actionItems: CommandItemData[] | undefined,
  query: string
) {
  const groups = useMemo<CommandGroup[]>(() => {
    const result: CommandGroup[] = commandSources
      .map((source) => {
        const items = source.getItems(query);
        if (items instanceof Promise || items.length === 0) {
          return null;
        }
        return {
          id: source.id,
          label: source.label,
          priority: source.priority,
          items,
        };
      })
      .filter((g): g is CommandGroup => g !== null);

    const dynamicGroups = [
      {
        id: "directorySearch",
        label: "Directories",
        priority: 10,
        items: directorySearchItems,
      },
      { id: "prompts", label: "Prompts", priority: 15, items: promptItems },
      { id: "actions", label: "Actions", priority: 70, items: actionItems },
      {
        id: "directories",
        label: "Manage Directories",
        priority: 75,
        items: syncDirectoryItems,
      },
    ];

    for (const g of dynamicGroups) {
      if (g.items?.length) {
        result.push({
          id: g.id,
          label: g.label,
          priority: g.priority,
          items: g.items,
        });
      }
    }

    return result.sort((a, b) => a.priority - b.priority);
  }, [
    query,
    promptItems,
    syncDirectoryItems,
    directorySearchItems,
    actionItems,
  ]);

  return { groups, isEmpty: groups.length === 0 };
}
