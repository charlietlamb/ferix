'use client';

import { Table as ShadcnTable } from '@ferix/ui/components/shadcn/table';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { TableBody } from './table-body';
import { TableColumnVisibility } from './table-column-visibility';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';

export interface TableProps<T> {
  table: TanstackTable<T>;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  enableSelection?: boolean;
}

export function Table<T>({
  table,
  filters,
  actions,
  enableSelection = true,
}: TableProps<T>) {
  const numberOfColumns = table.getAllColumns().length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        <TableColumnVisibility table={table} />
        {actions && <div className="ml-auto">{actions}</div>}
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <ShadcnTable className="table-fixed">
          <TableHeader
            enableSelection={enableSelection}
            headerGroups={table.getHeaderGroups()}
            table={table}
          />
          <TableBody
            enableSelection={enableSelection}
            numberOfColumns={numberOfColumns}
            rows={table.getRowModel().rows}
          />
        </ShadcnTable>
      </div>
      <TablePagination table={table} />
    </div>
  );
}
