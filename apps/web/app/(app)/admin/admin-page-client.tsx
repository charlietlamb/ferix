"use client";

import { AdminItem } from "@ferix/ui/components/admin/admin-item";
import { adminItems } from "@ferix/ui/components/admin/admin-items";
import { AppPage } from "@ferix/ui/components/layout/app-page";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@ferix/ui/components/layout/page-header";
import { useDialog } from "@ferix/ui/hooks/use-dialog";
import type { DialogKey } from "@ferix/ui/store/dialog";

export function AdminPageClient() {
  const { open } = useDialog();

  const handleAction = (dialog: DialogKey) => {
    open(dialog as "impersonatePalette");
  };

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
