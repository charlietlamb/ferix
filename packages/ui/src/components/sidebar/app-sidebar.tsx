import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@ferix/ui/components/ui/sidebar";
import { SidebarMainContent } from "./content/sidebar-content";
import { SidebarFooterContent } from "./footer/sidebar-footer";
import { SidebarHeaderContent } from "./header/sidebar-header";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarHeaderContent />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMainContent />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
