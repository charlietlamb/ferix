import { Separator } from '@ferix/ui/components/shadcn/separator';
import { SidebarTrigger } from '@ferix/ui/components/shadcn/sidebar';
import { HeaderActions } from '../header-actions';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container h-full px-2 md:px-4 lg:px-6">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-2">
        <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b px-2 py-4 transition-all ease-linear">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger className="-ms-1" />
            <div className="max-sm:hidden sm:contents">
              <Separator
                className="me-2 data-[orientation=vertical]:h-4"
                orientation="vertical"
              />
              <DashboardBreadcrumbs />
            </div>
          </div>
          <HeaderActions />
        </header>
        <div className="h-full overflow-hidden p-2">{children}</div>
      </div>
    </div>
  );
}
