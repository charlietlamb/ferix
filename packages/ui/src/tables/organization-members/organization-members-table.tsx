import { useMemo } from 'react'
import { Table } from '@ferix/ui/components/table/table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { OrganizationWithMembers } from '@ferix/types/organization-with-members'
import { organizationMembersColumns as columns } from '@ferix/ui/tables/organization-members/organization-members-columns'
import { OrganizationMembersFilter } from '@ferix/ui/tables/organization-members/organization-members-filter'

export function OrganizationMembersTable({
  organization,
}: {
  organization: OrganizationWithMembers
}) {
  const organizationMembersColumns = useMemo(() => columns, [])

  const table = useReactTable({
    data: organization.members ?? [],
    columns: organizationMembersColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    enableGlobalFilter: true,
  })

  return (
    <Table
      table={table}
      filters={<OrganizationMembersFilter table={table} />}
    />
  )
}
