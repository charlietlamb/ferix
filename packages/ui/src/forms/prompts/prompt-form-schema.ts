import { z } from "zod";

export const promptFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string(),
  tags: z.array(z.string()),
  directoryId: z.string().optional(),
});

export interface PromptFormValues {
  title: string;
  content: string;
  tags: string[];
  directoryId: string | undefined;
}

export const promptFormDefaults: PromptFormValues = {
  title: "",
  content: "",
  tags: [],
  directoryId: undefined,
};

// Partial schema for inline edits (single field updates)
export const promptTagsSchema = z.object({
  tags: z.array(z.string()),
});

export const promptDirectorySchema = z.object({
  directoryId: z.string().optional(),
});

export const promptSlugSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const promptContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});
