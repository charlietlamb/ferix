"use client";

import { api } from "@ferix/server/_generated/api";
import type { Prompt } from "@ferix/server/types";
import { ChatTextIcon } from "@phosphor-icons/react";
import { usePaginatedQuery } from "convex/react";
import type { CommandItemData } from "../types";

interface PromptsSourceResult {
  items: CommandItemData[];
  isLoading: boolean;
}

export function usePromptsSource(query: string): PromptsSourceResult {
  const { results, status } = usePaginatedQuery(
    api.prompts.list,
    { search: query || undefined },
    { initialNumItems: 10 }
  );
  const prompts = results as Prompt[];

  if (status === "LoadingFirstPage") {
    return { items: [], isLoading: true };
  }

  return {
    items: prompts.map((prompt) => ({
      id: `prompt-${prompt._id}`,
      type: "prompt" as const,
      label: prompt.title,
      description: prompt.slug,
      icon: ChatTextIcon,
      path: `/prompt/${prompt.slug}`,
    })),
    isLoading: false,
  };
}
