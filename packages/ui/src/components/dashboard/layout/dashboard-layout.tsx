import { Separator } from '@ferix/ui/components/shadcn/separator'
import { SidebarTrigger } from '@ferix/ui/components/shadcn/sidebar'
import { ActionButtons } from '@ferix/ui/components/dashboard/action-buttons'
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 lg:px-8 @container">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
        <header className="flex flex-wrap gap-3 min-h-20 py-4 shrink-0 items-center transition-all ease-linear border-b">
          {/* Left side */}
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger className="-ms-1" />
            <div className="max-lg:hidden lg:contents">
              <Separator
                orientation="vertical"
                className="me-2 data-[orientation=vertical]:h-4"
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
  )
}
