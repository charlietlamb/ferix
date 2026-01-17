"use client";

import { useSession } from "@ferix/auth/client";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import {
  FolderPlusIcon,
  GearIcon,
  MoonIcon,
  PlusIcon,
  UserSwitchIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useMemo } from "react";
import type { CommandItemData } from "../types";

interface ActionContext {
  isAdmin: boolean;
  isImpersonating: boolean;
}

interface ActionItem extends CommandItemData {
  keywords?: string[];
  show?: (ctx: ActionContext) => boolean;
}

const actions: ActionItem[] = [
  {
    id: "action-create-prompt",
    type: "action",
    labelKey: "actionsCreatePrompt",
    icon: PlusIcon,
    action: "createPromptDialog",
    keywords: ["new", "add", "create"],
  },
  {
    id: "action-import-directory",
    type: "action",
    labelKey: "actionsImportDirectory",
    icon: FolderPlusIcon,
    action: "addDirectoryDialog",
    keywords: ["import", "add", "directory", "github", "repo"],
  },
  {
    id: "action-settings",
    type: "action",
    labelKey: "actionsSettings",
    icon: GearIcon,
    action: "settingsDialog",
    keywords: ["preferences", "config"],
  },
  {
    id: "action-toggle-theme",
    type: "action",
    labelKey: "actionsToggleTheme",
    icon: MoonIcon,
    action: "toggleTheme",
    keywords: ["dark", "light", "mode"],
  },
  {
    id: "action-impersonate",
    type: "action",
    labelKey: "actionsImpersonate",
    icon: UserSwitchIcon,
    action: "impersonatePalette",
    keywords: ["impersonate", "user", "switch", "admin"],
    show: (ctx) => ctx.isAdmin && !ctx.isImpersonating,
  },
  {
    id: "action-stop-impersonating",
    type: "action",
    labelKey: "actionsStopImpersonating",
    icon: XCircleIcon,
    action: "stopImpersonating",
    keywords: ["stop", "impersonate", "exit", "switch back"],
    show: (ctx) => ctx.isImpersonating,
  },
];

export function useActionsSource(query: string) {
  const { isAdmin } = useAuthenticated();
  const { data: session } = useSession();
  const isImpersonating = !!session?.session?.impersonatedBy;

  const items = useMemo(() => {
    const ctx: ActionContext = { isAdmin, isImpersonating };
    const visibleActions = actions.filter((a) => !a.show || a.show(ctx));

    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return visibleActions;
    }

    return visibleActions.filter(
      (action) =>
        action.labelKey?.toLowerCase().includes(normalizedQuery) ||
        action.keywords?.some((k) => k.toLowerCase().includes(normalizedQuery))
    );
  }, [query, isAdmin, isImpersonating]);

  return { items };
}
