import { useQuery } from '@tanstack/react-query'
import { authClient } from '../lib/auth-client'
import type { Organization, Member } from 'better-auth/plugins/organization'

interface ErrorResponse {
  error: {
    code?: string
    message: string
  }
}

interface SuccessResponse {
  data: Organization & {
    members: Member[]
  }
}

type OrganizationResponse = ErrorResponse | SuccessResponse

export function useOrganizationMembers() {
  const { data: activeOrg } = authClient.useActiveOrganization()

  return useQuery({
    queryKey: ['organization-members', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) {
        throw new Error('No active organization')
      }

      // Get the full organization details
      const response = (await authClient.organization.getFullOrganization({
        query: { organizationId: activeOrg.id },
      })) as OrganizationResponse

      if ('error' in response) {
        throw new Error(
          response.error?.message || 'Failed to fetch organization members'
        )
      }

      return (response as SuccessResponse).data.members
    },
    enabled: !!activeOrg?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}
