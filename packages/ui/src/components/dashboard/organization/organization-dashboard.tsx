'use client';

import { Spinner } from '@ferix/ui/components/utility/loading/spinner';
import { authClient } from '@ferix/ui/lib/auth-client';
import { OrganizationMembersTable } from '@ferix/ui/tables/organization-members/organization-members-table';

export function OrganizationDashboard() {
  const { data: organization } = authClient.useActiveOrganization();

  if (!organization) {
    return <Spinner />;
  }

  return <OrganizationMembersTable organization={organization} />;
}
