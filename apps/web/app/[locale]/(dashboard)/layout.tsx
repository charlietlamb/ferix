import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar'
import { RedirectToSignIn } from '@daveyplate/better-auth-ui'
import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <RedirectToSignIn />
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <PageDashboardLayout>{children}</PageDashboardLayout>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
