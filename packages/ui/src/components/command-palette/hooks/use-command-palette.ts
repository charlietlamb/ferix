"use client";

import { useMemo } from "react";
import { commandSources } from "../sources";
import type { CommandGroup, CommandItemData } from "../types";

export function useCommandPalette(
  promptItems: CommandItemData[] | undefined,
  query: string
) {
  const groups = useMemo<CommandGroup[]>(() => {
    const staticGroups = commandSources
      .map((source) => {
        const items = source.getItems(query);
        if (items instanceof Promise) {
          return null;
        }
        if (items.length === 0) {
          return null;
        }
        return {
          id: source.id,
          label: source.label,
          priority: source.priority,
          items,
        };
      })
      .filter((group): group is CommandGroup => group !== null);

    if (promptItems && promptItems.length > 0) {
      staticGroups.push({
        id: "prompts",
        label: "Prompts",
        priority: 100,
        items: promptItems,
      });
    }

    return staticGroups.sort((a, b) => a.priority - b.priority);
  }, [query, promptItems]);

  const isEmpty = groups.length === 0;

  return {
    groups,
    isEmpty,
  };
}
