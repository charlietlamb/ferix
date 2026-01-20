import {
  ArrowsClockwiseIcon,
  GitBranchIcon,
  TrashIcon,
  UserSwitchIcon,
} from "@phosphor-icons/react";
import type { AdminItemProps } from "./admin-item";

export const adminItems: Omit<AdminItemProps, "onAction">[] = [
  {
    href: "/admin/featured-repositories",
    icon: GitBranchIcon,
    title: "Featured Repositories",
    description: "Manage which repositories appear first on the home page",
  },
  {
    dialog: "syncRepositoryPalette",
    icon: ArrowsClockwiseIcon,
    title: "Sync Repository",
    description: "Trigger a sync for a repository",
  },
  {
    dialog: "deleteRepositoryPalette",
    icon: TrashIcon,
    title: "Delete Repository",
    description: "Remove a repository and all its prompts",
  },
  {
    dialog: "impersonatePalette",
    icon: UserSwitchIcon,
    title: "Impersonate User",
    description: "Sign in as another user to debug issues",
  },
];
