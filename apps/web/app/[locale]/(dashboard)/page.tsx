import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@ferix/ui/components/shadcn/breadcrumb'
import { Separator } from '@ferix/ui/components/shadcn/separator'
import { SidebarTrigger } from '@ferix/ui/components/shadcn/sidebar'
import { Chart01 } from '@ferix/ui/components/dashboard/charts/chart-01'
import { Chart02 } from '@ferix/ui/components/dashboard/charts/chart-02'
import { Chart03 } from '@ferix/ui/components/dashboard/charts/chart-03'
import { Chart04 } from '@ferix/ui/components/dashboard/charts/chart-04'
import { Chart05 } from '@ferix/ui/components/dashboard/charts/chart-05'
import { Chart06 } from '@ferix/ui/components/dashboard/charts/chart-06'
import { ActionButtons } from '@ferix/ui/components/dashboard/action-buttons'
import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations('layout.header')
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
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          {/* Right side */}
          <ActionButtons />
        </header>
        <div className="overflow-hidden">
          <div className="grid auto-rows-min @2xl:grid-cols-2 *:-ms-px *:-mt-px -m-px gap-4 p-2">
            <Chart01 />
            <Chart02 />
            <Chart03 />
            <Chart04 />
            <Chart05 />
            <Chart06 />
          </div>
        </div>
      </div>
    </div>
  )
}
