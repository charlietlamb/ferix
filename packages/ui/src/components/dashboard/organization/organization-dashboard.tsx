'use client';

import type { OrganizationWithMembers } from '@ferix/types/organizations/organization-with-members';
import { OrganizationMembersTable } from '@ferix/ui/tables/organization-members/organization-members-table';

export function OrganizationDashboard({
  organization,
}: {
  organization: OrganizationWithMembers;
}) {
  return <OrganizationMembersTable organization={organization} />;
}
