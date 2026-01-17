import { PROMPT_TYPES, type PromptType } from "@ferix/ui/lib/prompt-types";
import { z } from "zod";

export const promptTypeSchema = z.enum(PROMPT_TYPES);

export const promptFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string(),
  type: promptTypeSchema,
  tags: z.array(z.string()),
});

export interface PromptFormValues {
  title: string;
  content: string;
  type: PromptType;
  tags: string[];
}

export const promptFormDefaults: PromptFormValues = {
  title: "",
  content: "",
  type: "subagent",
  tags: [],
};

// Partial schema for inline edits (single field updates)
export const promptTagsSchema = z.object({
  tags: z.array(z.string()),
});

export const promptSlugSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const promptContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});
