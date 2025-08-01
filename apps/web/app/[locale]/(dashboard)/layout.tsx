import { auth } from '@ferix/api/lib/auth';
import { redirect } from '@ferix/i18n/navigation';
import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout';
import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar';
import { Onboarding } from '@ferix/ui/components/onboarding/onboarding';
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar';
import { headers as nextHeaders } from 'next/headers';
import { getLocale } from 'next-intl/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headers, locale] = await Promise.all([nextHeaders(), getLocale()]);

  const session = await auth.api.getSession({ headers });

  if (!session) {
    return redirect({ href: '/auth/sign-in', locale });
  }
  const organizations = await auth.api.listOrganizations({ headers });

  if (organizations.length === 0) {
    return <Onboarding />;
  }

  return (
    <SidebarProvider className="h-screen">
      <DashboardSidebar />
      <SidebarInset>
        <PageDashboardLayout>{children}</PageDashboardLayout>
      </SidebarInset>
    </SidebarProvider>
  );
}
