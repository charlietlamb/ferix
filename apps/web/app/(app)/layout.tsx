import { Background } from "@ferix/ui/components/brand/background";
import { DashboardHeader } from "@ferix/ui/components/layout/dashboard-header";
import { AppSidebar } from "@ferix/ui/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@ferix/ui/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="overflow-hidden" defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <Background />
        <DashboardHeader />
        <div className="scrollbar-none z-10 min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
