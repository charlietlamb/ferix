"use client";

import { AdminBreadcrumbs } from "@ferix/ui/components/admin/admin-breadcrumbs";
import {
  FeaturedRepositoriesManager,
  useFeaturedRepositories,
} from "@ferix/ui/components/admin/featured-repositories-manager";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { Button } from "@ferix/ui/components/ui/button";

export function FeaturedRepositoriesPageClient() {
  const {
    setFeaturedIds,
    currentIds,
    allRepositories,
    hasChanges,
    isSaving,
    handleSave,
  } = useFeaturedRepositories();

  return (
    <AppPage>
      <div className="border-border border-b">
        <AdminBreadcrumbs current="Featured Repositories" />
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          <div className="flex flex-col gap-1">
            <PageHeaderTitle>Featured Repositories</PageHeaderTitle>
            <PageHeaderDescription>
              Drag to reorder. These appear first on the home page.
            </PageHeaderDescription>
          </div>
          {hasChanges && (
            <Button disabled={isSaving} onClick={handleSave} size="sm">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
      <div className="scrollbar-none h-full overflow-auto">
        <FeaturedRepositoriesManager
          allRepositories={allRepositories}
          currentIds={currentIds}
          setFeaturedIds={setFeaturedIds}
        />
      </div>
    </AppPage>
  );
}
