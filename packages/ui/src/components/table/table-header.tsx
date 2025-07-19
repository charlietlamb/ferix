import {
  TableHeader as ShadcnTableHeader,
  TableHead,
  TableRow,
} from '@ferix/ui/components/shadcn/table';
import {
  flexRender,
  type Header,
  type HeaderGroup,
} from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

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

function renderHeaderContent<TData>(header: Header<TData, unknown>) {
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

export function TableHeader<TData>({
  headerGroups,
}: {
  headerGroups: HeaderGroup<TData>[];
}) {
  return (
    <ShadcnTableHeader>
      {headerGroups.map((headerGroup) => (
        <TableRow className="hover:bg-transparent" key={headerGroup.id}>
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
