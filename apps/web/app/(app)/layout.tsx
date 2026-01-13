import { AppHeader } from "@ferix/ui/components/header/app-header";
import { AppSidebar } from "@ferix/ui/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@ferix/ui/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="overflow-hidden" defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="scrollbar-none min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
