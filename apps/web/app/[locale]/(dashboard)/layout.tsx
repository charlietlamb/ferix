import { DashboardLayout as PageDashboardLayout } from '@ferix/ui/components/dashboard/layout/dashboard-layout';
import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@ferix/ui/components/shadcn/sidebar';
import { ConvexAuthenticatedProvider } from '@ferix/ui/providers/convex-authenticated-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthenticatedProvider>
      <SidebarProvider className="h-screen">
        <DashboardSidebar />
        <SidebarInset>
          <PageDashboardLayout>{children}</PageDashboardLayout>
        </SidebarInset>
      </SidebarProvider>
    </ConvexAuthenticatedProvider>
  );
}
