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
    cell: ({ getValue }) => {
      const role = getValue<string>();
      const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
      return formattedRole;
    },
  },
  {
    header: 'Date Joined',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => {
      const date = getValue<number>();
      const formattedDate = new Date(date).toLocaleDateString();
      return formattedDate;
    },
  },
];
