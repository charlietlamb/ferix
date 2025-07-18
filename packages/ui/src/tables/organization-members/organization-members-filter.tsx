import { Input } from '@ferix/ui/components/shadcn/input'
import { cn } from '@ferix/ui/lib/utils'
import type { Table } from '@tanstack/react-table'
import type { Member } from 'better-auth/plugins/organization'
import { CircleXIcon, ListFilterIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function OrganizationMembersFilter({ table }: { table: Table<Member> }) {
  const t = useTranslations('table.organization.members')
  const globalFilter = table.getState().globalFilter

  return (
    <div className="relative">
      <Input
        className={cn(
          'peer min-w-60 ps-9 text-sm',
          Boolean(globalFilter) && 'pe-9'
        )}
        value={globalFilter ?? ''}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        placeholder={t('filter.placeholder')}
        type="text"
        aria-label={t('filter.placeholder-aria-label')}
      />
      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
        <ListFilterIcon size={16} aria-hidden="true" />
      </div>
      {Boolean(globalFilter) && (
        <button
          className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('filter.clear-filter-aria-label')}
          onClick={() => table.setGlobalFilter('')}
        >
          <CircleXIcon size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
