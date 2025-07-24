import { Input } from '@ferix/ui/components/shadcn/input';
import { cn } from '@ferix/ui/lib/utils';
import type { Table } from '@tanstack/react-table';
import type { Member } from 'better-auth/plugins/organization';
import { CircleXIcon, ListFilterIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function OrganizationMembersFilter({ table }: { table: Table<Member> }) {
  const t = useTranslations('organization.table.members');
  const globalFilter = table.getState().globalFilter;

  return (
    <div className="relative">
      <Input
        aria-label={t('filter.placeholder-aria-label')}
        className={cn(
          'peer min-w-60 ps-9 text-sm',
          Boolean(globalFilter) && 'pe-9'
        )}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        placeholder={t('filter.placeholder')}
        type="text"
        value={globalFilter ?? ''}
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
        <ListFilterIcon aria-hidden="true" size={16} />
      </div>
      {Boolean(globalFilter) && (
        <button
          aria-label={t('filter.clear-filter-aria-label')}
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => table.setGlobalFilter('')}
          type="button"
        >
          <CircleXIcon aria-hidden="true" size={16} />
        </button>
      )}
    </div>
  );
}
