'use client'

import { authClient } from '@ferix/ui/lib/auth-client'

export function OrganizationDashboard() {
  const { data: organizations } = authClient.useListOrganizations()
  return (
    <div>
      <h1>Organizations</h1>
      <pre>{JSON.stringify(organizations, null, 2)}</pre>
    </div>
  )
}
