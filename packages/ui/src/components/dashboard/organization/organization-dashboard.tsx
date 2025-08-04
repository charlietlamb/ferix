'use client';

import { useOrganizationMembers } from '@ferix/ui/hooks/use-organization-members';
import { OrganizationMembersTable } from '@ferix/ui/tables/organization-members/organization-members-table';

export function OrganizationDashboard() {
  const { organizationMembers, isLoading } = useOrganizationMembers();

  return (
    <OrganizationMembersTable
      data={organizationMembers}
      isLoading={isLoading}
    />
  );
}
