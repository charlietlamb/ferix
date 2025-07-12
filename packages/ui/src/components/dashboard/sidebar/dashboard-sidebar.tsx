import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter,
} from '@ferix/ui/components/shadcn/sidebar'

export function DashboardSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>Dashboard</SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Settings</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter></SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
