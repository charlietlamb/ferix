'use client';

import { Checkbox } from '@ferix/ui/components/shadcn/checkbox';
import {
  TableHeader as ShadcnTableHeader,
  TableHead,
  TableRow,
} from '@ferix/ui/components/shadcn/table';
import {
  flexRender,
  type HeaderGroup,
  type Table,
} from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

function renderSortIcon(sortDirection: string | false) {
  if (!sortDirection) {
    return null;
  }

  return sortDirection === 'asc' ? (
    <ChevronUpIcon
      aria-hidden="true"
      className="shrink-0 opacity-60"
      size={16}
    />
  ) : (
    <ChevronDownIcon
      aria-hidden="true"
      className="shrink-0 opacity-60"
      size={16}
    />
  );
}

function renderHeaderContent<T>(header: HeaderGroup<T>['headers'][number]) {
  if (header.isPlaceholder) {
    return null;
  }

  if (!header.column.getCanSort()) {
    return flexRender(header.column.columnDef.header, header.getContext());
  }

  return (
    <button
      className="flex h-full w-full cursor-pointer select-none items-center justify-between gap-2"
      onClick={header.column.getToggleSortingHandler()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.column.getToggleSortingHandler()?.(e);
        }
      }}
      type="button"
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {renderSortIcon(header.column.getIsSorted())}
    </button>
  );
}

interface TableHeaderProps<T> {
  headerGroups: HeaderGroup<T>[];
  enableSelection?: boolean;
  table?: Table<T>;
}

export function TableHeader<T>({
  headerGroups,
  enableSelection = false,
  table,
}: TableHeaderProps<T>) {
  const t = useTranslations('table');
  return (
    <ShadcnTableHeader>
      {headerGroups.map((headerGroup) => (
        <TableRow className="hover:bg-transparent" key={headerGroup.id}>
          {enableSelection && table && (
            <TableHead className="w-[50px]">
              <Checkbox
                aria-label={t('selection.select-all')}
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(checked) =>
                  table.toggleAllPageRowsSelected(!!checked)
                }
              />
            </TableHead>
          )}
          {headerGroup.headers.map((header) => (
            <TableHead
              className="h-11"
              key={header.id}
              style={{ width: `${header.getSize()}px` }}
            >
              {renderHeaderContent(header)}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </ShadcnTableHeader>
  );
}
