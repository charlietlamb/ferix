"use client";

import { Link, useRouter } from "@ferix/i18n/navigation";
import { FeaturedRepositoriesManager } from "@ferix/ui/components/admin/featured-repositories-manager";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ferix/ui/components/ui/breadcrumb";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useEffect } from "react";

export function FeaturedRepositoriesPageClient() {
  const { isAdmin, isPending } = useAuthenticated();
  const router = useRouter();

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
      <PageHeader className="border-border border-b">
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/admin" />}>
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Featured Repositories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeaderTitle>Featured Repositories</PageHeaderTitle>
        <PageHeaderDescription>
          Drag to reorder. These appear first on the home page.
        </PageHeaderDescription>
      </PageHeader>
      <div className="scrollbar-none h-full overflow-auto">
        <FeaturedRepositoriesManager />
      </div>
    </AppPage>
  );
}
