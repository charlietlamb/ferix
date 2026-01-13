import type { CommandSource } from "../types";
import { actionsSource } from "./actions-source";
import { pagesSource } from "./pages-source";
import { tagsSource } from "./tags-source";

export const commandSources: CommandSource[] = [
  tagsSource,
  pagesSource,
  actionsSource,
].sort((a, b) => a.priority - b.priority);
