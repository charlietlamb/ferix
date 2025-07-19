import type { OrganizationWithMembers } from '@ferix/types/organization-with-members';
import { Table } from '@ferix/ui/components/table/table';
import { organizationMembersColumns as columns } from '@ferix/ui/tables/organization-members/organization-members-columns';
import { OrganizationMembersFilter } from '@ferix/ui/tables/organization-members/organization-members-filter';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';

export function OrganizationMembersTable({
  organization,
}: {
  organization: OrganizationWithMembers;
}) {
  const organizationMembersColumns = useMemo(() => columns, []);

  const table = useReactTable({
    data: organization.members ?? [],
    columns: organizationMembersColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    enableGlobalFilter: true,
  });

  return (
    <Table
      filters={<OrganizationMembersFilter table={table} />}
      table={table}
    />
  );
}
