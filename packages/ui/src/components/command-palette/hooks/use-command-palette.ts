"use client";

import { useMemo, useState } from "react";
import { commandSources } from "../sources";
import type { CommandGroup } from "../types";

export function useCommandPalette() {
  const [query, setQuery] = useState("");

  const groups = useMemo<CommandGroup[]>(() => {
    return commandSources
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
  }, [query]);

  const isEmpty = groups.length === 0;

  const resetQuery = () => setQuery("");

  return {
    query,
    setQuery,
    groups,
    isEmpty,
    resetQuery,
  };
}
