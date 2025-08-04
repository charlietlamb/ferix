import { Separator } from '@ferix/ui/components/shadcn/separator';
import { SidebarTrigger } from '@ferix/ui/components/shadcn/sidebar';
import { HeaderActions } from '../header-actions';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="min-h-16 gap-3 border-b px-4 py-4 transition-all ease-linear md:px-6 lg:px-8">
        <div className="container mx-auto flex shrink-0 flex-wrap items-center">
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
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="container relative mx-auto px-4 md:px-0 h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
