import type { Doc } from "./_generated/dataModel";

export type Prompt = Doc<"prompts"> & {
  creator: {
    name: string;
    image: string | null;
    username: string | null;
  } | null;
  isSaved: boolean;
};

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type PaginatedPrompts = PaginatedResponse<Prompt>;
