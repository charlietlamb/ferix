import type { Doc } from "./_generated/dataModel";

export type PromptWithContent = Doc<"prompts"> & {
  content: string;
  creator: { name: string; image: string | null } | null;
};
