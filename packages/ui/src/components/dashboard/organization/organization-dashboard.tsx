'use client';

import type { OrganizationWithMembers } from '@ferix/types/organizations/organization-with-members';
import { OrganizationMembersTable } from '@ferix/ui/tables/organization-members/organization-members-table';

export function OrganizationDashboard({
  organization,
}: {
  organization: OrganizationWithMembers | null;
}) {
  if (!organization) {
    return <div>No organization found</div>;
  }
  return <OrganizationMembersTable organization={organization} />;
}
