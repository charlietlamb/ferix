import { auth } from '@ferix/api/lib/auth';
import { OrganizationDashboard } from '@ferix/ui/components/dashboard/organization/organization-dashboard';
import { headers as nextHeadres } from 'next/headers';

export default async function OrganizationsPage() {
  const headers = await nextHeadres();
  const organization = await auth.api.getFullOrganization({
    headers,
  });
  return <OrganizationDashboard organization={organization} />;
}
