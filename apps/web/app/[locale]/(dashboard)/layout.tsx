import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar'
import { RedirectToSignIn } from '@daveyplate/better-auth-ui'

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
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  )
}
