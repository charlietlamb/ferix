import { z } from "zod";

export const createPromptFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()),
});

export type CreatePromptFormValues = z.infer<typeof createPromptFormSchema>;

export const createPromptFormDefaults: CreatePromptFormValues = {
  title: "",
  content: "",
  tags: [],
};
