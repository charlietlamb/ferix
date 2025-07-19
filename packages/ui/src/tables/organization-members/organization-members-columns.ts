import type { ColumnDef } from '@tanstack/react-table';
import type { Member } from 'better-auth/plugins/organization';

export const organizationMembersColumns: ColumnDef<Member>[] = [
  {
    header: 'User Name',
    accessorKey: 'user.name',
  },
  {
    header: 'Organization Role',
    accessorKey: 'role',
  },
  {
    header: 'Date Joined',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => {
      const date = getValue<Date>();
      return date.toLocaleDateString();
    },
  },
];
