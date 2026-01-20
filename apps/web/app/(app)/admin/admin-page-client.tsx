"use client";

import { useRouter } from "@ferix/i18n/navigation";
import { AdminItem } from "@ferix/ui/components/admin/admin-item";
import { adminItems } from "@ferix/ui/components/admin/admin-items";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { useAuthenticated } from "@ferix/ui/hooks/use-authenticated";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import type { DialogKey } from "@ferix/ui/store/dialog";
import { useEffect } from "react";

export function AdminPageClient() {
  const { isAdmin, isPending } = useAuthenticated();
  const { open } = useDialog();
  const router = useRouter();

  useEffect(() => {
    if (!(isPending || isAdmin)) {
      router.replace("/");
    }
  }, [isAdmin, isPending, router]);

  const handleAction = (dialog: DialogKey) => {
    open(dialog as "impersonatePalette");
  };

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
        <PageHeaderTitle>Admin</PageHeaderTitle>
        <PageHeaderDescription>
          Manage site settings and content
        </PageHeaderDescription>
      </PageHeader>
      <div className="scrollbar-none h-full overflow-auto">
        <div className="overflow-hidden">
          <div className="-mr-px grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 [&>*]:border-border [&>*]:border-r [&>*]:border-b">
            {adminItems.map((item) => (
              <AdminItem
                {...item}
                key={item.href ?? item.dialog}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      </div>
    </AppPage>
  );
}
