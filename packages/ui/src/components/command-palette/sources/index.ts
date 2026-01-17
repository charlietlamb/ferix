import type { CommandSource } from "../types";
import { pagesSource } from "./pages-source";
import { tagsSource } from "./tags-source";

export const commandSources: CommandSource[] = [tagsSource, pagesSource].sort(
  (a, b) => a.priority - b.priority
);
