import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout';
import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-screen">
      <DashboardSidebar />
      <SidebarInset>
        <PageDashboardLayout>{children}</PageDashboardLayout>
      </SidebarInset>
    </SidebarProvider>
  );
}
