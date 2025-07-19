import { ActionButtons } from '@ferix/ui/components/dashboard/action-buttons';
import { Separator } from '@ferix/ui/components/shadcn/separator';
import { SidebarTrigger } from '@ferix/ui/components/shadcn/sidebar';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container px-4 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex min-h-20 shrink-0 flex-wrap items-center gap-3 border-b py-4 transition-all ease-linear">
          {/* Left side */}
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger className="-ms-1" />
            <div className="max-lg:hidden lg:contents">
              <Separator
                className="me-2 data-[orientation=vertical]:h-4"
                orientation="vertical"
              />
              <DashboardBreadcrumbs />
            </div>
          </div>
          {/* Right side */}
          <ActionButtons />
        </header>
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
