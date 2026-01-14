import { AppPage } from "@ferix/ui/components/layout/app-page";
import { PromptGridSkeleton } from "@ferix/ui/components/prompts/grid/prompt-grid-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ferix/ui/components/ui/tabs";
import { UserProfileHeaderSkeleton } from "./user-profile-header-skeleton";
import type { ProfileTab } from "./user-profile-tabs";

interface UserProfileSkeletonProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function UserProfileSkeleton({
  activeTab,
  onTabChange,
}: UserProfileSkeletonProps) {
  return (
    <AppPage>
      <UserProfileHeaderSkeleton />
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
              Created
            </TabsTrigger>
            <TabsTrigger
              className="px-3 py-2 text-sm after:-bottom-0.5!"
              value="saved"
            >
              Saved
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent className="flex-1 overflow-hidden" value="created">
          <PromptGridSkeleton className="border-t-0" />
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}
