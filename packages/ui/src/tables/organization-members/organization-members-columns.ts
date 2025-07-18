import type { ColumnDef } from '@tanstack/react-table'
import type { Member } from 'better-auth/plugins/organization'

export const organizationMembersColumns: ColumnDef<Member>[] = [
  {
    header: 'ID',
    accessorKey: 'user.name',
  },
  {
    header: 'Role',
    accessorKey: 'role',
  },
  {
    header: 'Joined',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => {
      const date = getValue<Date>()
      return date.toLocaleDateString()
    },
  },
]
