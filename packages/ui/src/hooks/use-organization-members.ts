import { authClient } from '@ferix/ui/lib/auth-client';
import { useMemo } from 'react';

export function useOrganizationMembers() {
  const { data: organization, isPending } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();

  const hasNoActiveOrganization =
    !(organization || isPending) && organizations?.length;

  async function handleSetActiveOrganization() {
    if (!organizations?.length) {
      return;
    }
    const firstOrganization = organizations[0];
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
