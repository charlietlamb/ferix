import type { Doc, Id } from "./_generated/dataModel";

export type Prompt = Doc<"prompts"> & {
  creator: {
    name: string;
    image: string | null;
    username: string | null;
  } | null;
  directory: {
    _id: Id<"directories">;
    owner: string;
    repo: string;
  } | null;
  isSaved: boolean;
};

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type PaginatedPrompts = PaginatedResponse<Prompt>;
