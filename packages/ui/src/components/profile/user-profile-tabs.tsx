"use client";

import { api } from "@ferix/server/_generated/api";
import { PromptGrid } from "@ferix/ui/components/prompts/grid/prompt-grid";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ferix/ui/components/ui/tabs";
import { usePaginatedQuery } from "convex/react";
import { useTranslations } from "next-intl";

export type ProfileTab = "created" | "saved";

interface UserProfileTabsProps {
  userId: string;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function UserProfileTabs({
  userId,
  activeTab,
  onTabChange,
}: UserProfileTabsProps) {
  const t = useTranslations("pages.user");

  const {
    results: createdPrompts,
    status: createdStatus,
    loadMore: loadMoreCreated,
  } = usePaginatedQuery(
    api.profiles.listCreatedPrompts,
    { userId },
    { initialNumItems: 20 }
  );

  const {
    results: savedPrompts,
    status: savedStatus,
    loadMore: loadMoreSaved,
  } = usePaginatedQuery(
    api.profiles.listSavedPrompts,
    { userId },
    { initialNumItems: 20 }
  );

  return (
    <Tabs
      className="flex flex-1 flex-col gap-0 overflow-hidden"
      onValueChange={(value) => onTabChange(value as ProfileTab)}
      value={activeTab}
    >
      <div className="flex border-border border-b px-4">
        <TabsList className="h-auto gap-0 p-0" variant="line">
          <TabsTrigger
            className="px-3 py-2 text-sm after:-bottom-0.5!"
            value="created"
          >
            {t("created")}
          </TabsTrigger>
          <TabsTrigger
            className="px-3 py-2 text-sm after:-bottom-0.5!"
            value="saved"
          >
            {t("saved")}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent className="flex-1 overflow-hidden" value="created">
        <PromptGrid
          hideBorderTop
          onLoadMore={() => loadMoreCreated(20)}
          prompts={createdPrompts}
          status={createdStatus}
        />
      </TabsContent>
      <TabsContent className="flex-1 overflow-hidden" value="saved">
        <PromptGrid
          hideBorderTop
          onLoadMore={() => loadMoreSaved(20)}
          prompts={savedPrompts}
          status={savedStatus}
        />
      </TabsContent>
    </Tabs>
  );
}
