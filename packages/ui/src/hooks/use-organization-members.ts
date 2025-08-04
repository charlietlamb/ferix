import { authClient } from '@ferix/ui/lib/auth-client';
import { useMemo } from 'react';

export function useOrganizationMembers() {
  const { data: organization, isPending } = authClient.useActiveOrganization();

  const hasNoActiveOrganization = !(organization || isPending);

  async function handleSetActiveOrganization() {
    const organizations = await authClient.organization.list();
    const firstOrganization = organizations.data?.[0];
    await authClient.organization.setActive({
      organizationId: firstOrganization?.id,
    });
  }

  if (hasNoActiveOrganization) {
    handleSetActiveOrganization();
  }

  const organizationMembers = useMemo(() => {
    return organization?.members ?? [];
  }, [organization?.members]);

  return {
    organization,
    isLoading: isPending,
    organizationMembers,
  };
}
