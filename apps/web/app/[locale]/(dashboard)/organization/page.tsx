import { auth } from '@ferix/api/lib/auth';
import { redirect } from '@ferix/i18n/navigation';
import type { OrganizationWithMembers } from '@ferix/types/organizations/organization-with-members';
import { OrganizationDashboard } from '@ferix/ui/components/dashboard/organization/organization-dashboard';
import { headers as nextHeadres } from 'next/headers';
import { getLocale } from 'next-intl/server';

export default async function OrganizationsPage() {
  const headers = await nextHeadres();
  let organization: OrganizationWithMembers | null = null;
  const locale = await getLocale();
  if (!organization) {
    const organizations = await auth.api.listOrganizations({ headers });
    if (organizations.length === 0) {
      return redirect({ href: '/', locale });
    }
    await auth.api.setActiveOrganization({
      headers,
      body: {
        organizationId: organizations[0].id,
      },
    });

    organization = (await auth.api.getFullOrganization({
      headers,
    })) as OrganizationWithMembers;
  }

  return <OrganizationDashboard organization={organization} />;
}
