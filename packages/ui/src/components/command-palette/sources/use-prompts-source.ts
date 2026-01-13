"use client";

import { api } from "@ferix/server/_generated/api";
import { ChatTextIcon } from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import type { CommandItemData } from "../types";

interface PromptsSourceResult {
  items: CommandItemData[];
  isLoading: boolean;
}

export function usePromptsSource(query: string): PromptsSourceResult {
  const prompts = useQuery(api.prompts.search, { query });

  if (prompts === undefined) {
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
