import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@ferix/ui/components/ui/sidebar";
import { SidebarMainContent } from "./content/sidebar-content";
import { SidebarFooterContent } from "./footer/sidebar-footer";
import { SidebarHeaderContent } from "./header/sidebar-header";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offExamples" variant="inset">
      <SidebarHeaderContent />
      <SidebarContent>
        <SidebarMainContent />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent />
      </SidebarFooter>
      <SidebarRail className="group-data-[state=collapsed]:hidden" />
    </Sidebar>
  );
}
