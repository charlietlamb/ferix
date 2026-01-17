export type CommandItemType =
  | "tag"
  | "prompt"
  | "action"
  | "page"
  | "directory";

export interface CommandItemData {
  id: string;
  type: CommandItemType;
  label?: string;
  labelKey?: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Image URL to display instead of icon (e.g., GitHub avatar) */
  imageUrl?: string;
  keywords?: string[];
  shortcut?: string;
  path?: string;
  action?: string;
}

export interface CommandGroup {
  id: string;
  label: string;
  priority: number;
  items: CommandItemData[];
}

export interface CommandSource {
  id: string;
  label: string;
  priority: number;
  getItems: (query: string) => CommandItemData[] | Promise<CommandItemData[]>;
  isAsync?: boolean;
}
