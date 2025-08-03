'use client';

import { authClient } from '@ferix/ui/lib/auth-client';
import { OrganizationMembersTable } from '@ferix/ui/tables/organization-members/organization-members-table';

export function OrganizationDashboard() {
  const { data: organization, isPending } = authClient.useActiveOrganization();

  return (
    <OrganizationMembersTable
      isLoading={isPending}
      organization={organization}
    />
  );
}
