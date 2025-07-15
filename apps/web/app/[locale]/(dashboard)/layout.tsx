import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar'
import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout'
import { auth } from '@ferix/api/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return redirect('/auth/sign-in')
  }
  return (
    <>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <PageDashboardLayout>{children}</PageDashboardLayout>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
