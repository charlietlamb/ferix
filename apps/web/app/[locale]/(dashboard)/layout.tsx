import { DashboardSidebar } from '@ferix/ui/components/dashboard/sidebar/dashboard-sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <DashboardSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
