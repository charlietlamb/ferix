import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar'
import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout'
import { auth } from '@ferix/api/lib/auth'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from '@ferix/i18n/navigation'
import { Onboarding } from '@ferix/ui/components/onboarding/onboarding'
import { getLocale } from 'next-intl/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [headers, locale] = await Promise.all([nextHeaders(), getLocale()])
  const [session, organizations] = await Promise.all([
    auth.api.getSession({
      headers,
    }),
    auth.api.listOrganizations({
      headers,
    }),
  ])

  if (!session) {
    return redirect({ href: '/auth/sign-in', locale })
  }

  if (organizations.length === 0) {
    return <Onboarding />
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <PageDashboardLayout>{children}</PageDashboardLayout>
      </SidebarInset>
    </SidebarProvider>
  )
}
