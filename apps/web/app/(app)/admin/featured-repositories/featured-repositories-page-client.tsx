"use client";

import { useRouter } from "@ferix/i18n/navigation";
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
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useEffect } from "react";

export function FeaturedRepositoriesPageClient() {
  const { isAdmin, isPending } = useAuthenticated();
  const router = useRouter();
  const {
    setFeaturedIds,
    currentIds,
    allRepositories,
    hasChanges,
    isSaving,
    handleSave,
  } = useFeaturedRepositories();

  useEffect(() => {
    if (!(isPending || isAdmin)) {
      router.replace("/");
    }
  }, [isAdmin, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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
