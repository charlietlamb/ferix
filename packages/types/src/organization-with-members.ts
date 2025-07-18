import type { Member, Organization } from 'better-auth/plugins/organization'

export type OrganizationWithMembers = Organization & {
  members: Member[]
}
