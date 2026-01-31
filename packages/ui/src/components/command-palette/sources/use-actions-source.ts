"use client";

import { useSession } from "@ferix/auth/client";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import {
  ArrowsClockwiseIcon,
  BookmarkIcon,
  ClockIcon,
  FireIcon,
  FolderIcon,
  FolderPlusIcon,
  GearIcon,
  GitBranchIcon,
  HouseIcon,
  MoonIcon,
  PlusIcon,
  ShieldIcon,
  TagIcon,
  TrashIcon,
  UploadSimpleIcon,
  UserIcon,
  UserSwitchIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import type { CommandItemData } from "../types";

interface ActionContext {
  isAdmin: boolean;
  isImpersonating: boolean;
  isAuthenticated: boolean;
  username: string | null;
}

interface ActionItem extends Omit<CommandItemData, "type"> {
  keywords?: string[];
  show?: (ctx: ActionContext) => boolean;
}

const isAdmin = (ctx: ActionContext) => ctx.isAdmin;
const isAuthenticated = (ctx: ActionContext) =>
  ctx.isAuthenticated && !!ctx.username;
const isImpersonating = (ctx: ActionContext) => ctx.isImpersonating;
const canImpersonate = (ctx: ActionContext) =>
  ctx.isAdmin && !ctx.isImpersonating;

const actions: ActionItem[] = [
  // Navigation - Browse
  {
    id: "action-home",
    labelKey: "actionsHome",
    icon: HouseIcon,
    action: "navigateHome",
    keywords: ["home", "main", "start"],
  },
  {
    id: "action-popular",
    labelKey: "actionsPopular",
    icon: FireIcon,
    action: "navigatePopular",
    keywords: ["popular", "trending", "top", "hot"],
  },
  {
    id: "action-recent",
    labelKey: "actionsRecent",
    icon: ClockIcon,
    action: "navigateRecent",
    keywords: ["recent", "new", "latest"],
  },
  {
    id: "action-tags",
    labelKey: "actionsTags",
    icon: TagIcon,
    action: "navigateTags",
    keywords: ["tags", "categories", "labels"],
  },
  {
    id: "action-repositories",
    labelKey: "actionsRepositories",
    icon: FolderIcon,
    action: "navigateRepositories",
    keywords: ["repositories", "repos", "github", "browse"],
  },
  // Navigation - Personal
  {
    id: "action-my-profile",
    labelKey: "actionsMyProfile",
    icon: UserIcon,
    action: "navigateMyProfile",
    keywords: ["profile", "me", "my", "account"],
    show: isAuthenticated,
  },
  {
    id: "action-saved",
    labelKey: "actionsSaved",
    icon: BookmarkIcon,
    action: "navigateSaved",
    keywords: ["saved", "bookmarks", "favorites"],
    show: isAuthenticated,
  },
  // Actions
  {
    id: "action-create-prompt",
    labelKey: "actionsCreatePrompt",
    icon: PlusIcon,
    action: "createPromptDialog",
    keywords: ["new", "add", "create"],
  },
  {
    id: "action-import-repository",
    labelKey: "actionsImportRepository",
    icon: FolderPlusIcon,
    action: "addRepositoryDialog",
    keywords: ["import", "add", "repository", "github", "repo"],
  },
  {
    id: "action-settings",
    labelKey: "actionsSettings",
    icon: GearIcon,
    action: "settingsDialog",
    keywords: ["preferences", "config"],
  },
  {
    id: "action-toggle-theme",
    labelKey: "actionsToggleTheme",
    icon: MoonIcon,
    action: "toggleTheme",
    keywords: ["dark", "light", "mode"],
  },
  // Admin
  {
    id: "action-admin-dashboard",
    labelKey: "actionsAdminDashboard",
    icon: ShieldIcon,
    action: "navigateAdmin",
    keywords: ["admin", "dashboard", "manage", "settings"],
    show: isAdmin,
  },
  {
    id: "action-featured-repositories",
    labelKey: "actionsFeaturedRepositories",
    icon: GitBranchIcon,
    action: "navigateFeaturedRepositories",
    keywords: ["featured", "repositories", "top", "order", "admin", "home"],
    show: isAdmin,
  },
  {
    id: "action-bulk-imports",
    labelKey: "actionsBulkImports",
    icon: UploadSimpleIcon,
    action: "navigateBulkImports",
    keywords: ["bulk", "import", "batch", "multiple", "github", "admin"],
    show: isAdmin,
  },
  {
    id: "action-sync-repository",
    labelKey: "actionsSyncRepository",
    icon: ArrowsClockwiseIcon,
    action: "syncRepositoryPalette",
    keywords: ["sync", "repository", "refresh", "update"],
    show: isAdmin,
  },
  {
    id: "action-delete-repository",
    labelKey: "actionsDeleteRepository",
    icon: TrashIcon,
    action: "deleteRepositoryPalette",
    keywords: ["delete", "repository", "remove"],
    show: isAdmin,
  },
  {
    id: "action-impersonate",
    labelKey: "actionsImpersonate",
    icon: UserSwitchIcon,
    action: "impersonatePalette",
    keywords: ["impersonate", "user", "switch", "admin"],
    show: canImpersonate,
  },
  {
    id: "action-stop-impersonating",
    labelKey: "actionsStopImpersonating",
    icon: XCircleIcon,
    action: "stopImpersonating",
    keywords: ["stop", "impersonate", "exit", "switch back"],
    show: isImpersonating,
  },
];

export function useActionsSource(query: string) {
  const { isAdmin, isAuthenticated, user } = useAuthenticated();
  const { data: session } = useSession();
  const isImpersonatingUser = !!session?.session?.impersonatedBy;
  const username =
    (user as { username?: string | null } | undefined)?.username ?? null;

  const items = useMemo(() => {
    const ctx: ActionContext = {
      isAdmin,
      isImpersonating: isImpersonatingUser,
      isAuthenticated,
      username,
    };

    const visibleActions = actions.filter((a) => !a.show || a.show(ctx));

    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return visibleActions.map((a) => ({ ...a, type: "action" as const }));
    }

    return visibleActions
      .filter(
        (action) =>
          action.labelKey?.toLowerCase().includes(normalizedQuery) ||
          action.keywords?.some((k) =>
            k.toLowerCase().includes(normalizedQuery)
          )
      )
      .map((a) => ({ ...a, type: "action" as const }));
  }, [query, isAdmin, isImpersonatingUser, isAuthenticated, username]);

  return { items };
}
