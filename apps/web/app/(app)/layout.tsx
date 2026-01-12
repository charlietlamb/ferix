import { AppHeader } from "@ferix/ui/components/header/app-header";
import { AppSidebar } from "@ferix/ui/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@ferix/ui/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
