import type { OrganizationWithMembers } from '@ferix/types/organizations/organization-with-members';
import { DashboardPage } from '@ferix/ui/components/dashboard/layout/dashboard-page';
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
  isLoading,
}: {
  organization: OrganizationWithMembers | null;
  isLoading: boolean;
}) {
  const organizationMembersColumns = useMemo(
    () => columns(isLoading),
    [isLoading]
  );
  const mockColumn = {
    user: {
      name: '',
    },
    role: '',
    createdAt: 0,
  };
  const t = useTranslations('organization.invite.dialog');
  const { open } = useModal();

  const table = useReactTable({
    data: organization?.members ?? new Array(10).fill(mockColumn),
    columns: organizationMembersColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    enableGlobalFilter: true,
  });

  return (
    <DashboardPage>
      <Table
        actions={
          <Button
            onClick={() => open('inviteOrganizationMember', undefined)}
            variant="outline"
          >
            {t('trigger')}
          </Button>
        }
        filters={<OrganizationMembersFilter table={table} />}
        table={table}
      />
    </DashboardPage>
  );
}
