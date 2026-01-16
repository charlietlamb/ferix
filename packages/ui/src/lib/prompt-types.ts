import {
  BookOpenIcon,
  BrainIcon,
  GearIcon,
  UserRectangleIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

export const PROMPT_TYPES = ["rules", "subagent", "system", "skill"] as const;

export type PromptType = (typeof PROMPT_TYPES)[number];

export interface PromptTypeConfig {
  id: PromptType;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const promptTypeConfigs: Record<PromptType, PromptTypeConfig> = {
  rules: {
    id: "rules",
    label: "Rules",
    description: "Project-wide rules and guidelines (.cursorrules, CLAUDE.md)",
    icon: BookOpenIcon,
  },
  subagent: {
    id: "subagent",
    label: "Subagent",
    description: "Autonomous agent task prompts for Claude Code, Cursor Agent",
    icon: UserRectangleIcon,
  },
  system: {
    id: "system",
    label: "System",
    description: "System prompts for chat context and behavior",
    icon: GearIcon,
  },
  skill: {
    id: "skill",
    label: "Skill",
    description: "Reusable skills and specialized knowledge prompts",
    icon: BrainIcon,
  },
};

export function getPromptTypeConfig(type: PromptType): PromptTypeConfig {
  return promptTypeConfigs[type];
}

export function promptTypesToOptions() {
  return PROMPT_TYPES.map((type) => {
    const config = promptTypeConfigs[type];
    return {
      value: type,
      label: config.label,
      description: config.description,
      icon: config.icon,
    };
  });
}
