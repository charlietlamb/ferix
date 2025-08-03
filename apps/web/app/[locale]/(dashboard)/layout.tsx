import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout';
import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar';
import { Onboarding } from '@ferix/ui/components/onboarding/onboarding';
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar';
import { listOrganizations } from '@ferix/ui/server/list-organizations';
import { headers } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: organizations, error } = await listOrganizations(
    await headers()
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

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
