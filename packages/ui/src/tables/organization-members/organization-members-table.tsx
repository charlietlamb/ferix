import type { OrganizationWithMembers } from '@ferix/types/organizations/organization-with-members';
import { Button } from '@ferix/ui/components/shadcn/button';
import { Table } from '@ferix/ui/components/table/table';
import { useModal } from '@ferix/ui/hooks/use-modal';
import { organizationMembersColumns as columns } from '@ferix/ui/tables/organization-members/organization-members-columns';
import { OrganizationMembersFilter } from '@ferix/ui/tables/organization-members/organization-members-filter';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export function OrganizationMembersTable({
  organization,
}: {
  organization: OrganizationWithMembers;
}) {
  const organizationMembersColumns = useMemo(() => columns, []);
  const t = useTranslations('organization.invite.dialog');
  const { open } = useModal();

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
      actions={
        <Button
          onClick={() => open('inviteOrganizationMember')}
          variant="outline"
        >
          {t('trigger')}
        </Button>
      }
      filters={<OrganizationMembersFilter table={table} />}
      table={table}
    />
  );
}
