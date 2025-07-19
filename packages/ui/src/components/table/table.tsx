'use client';

import { Table as ShadcnTable } from '@ferix/ui/components/shadcn/table';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { TableBody } from './table-body';
import { TableHeader } from './table-header';
import { TablePagination } from './table-pagination';

export function Table<T>({
  table,
  filters,
}: {
  table: TanstackTable<T>;
  filters: React.ReactNode;
}) {
  const numberOfColumns = table.getAllColumns().length;

  return (
    <div className="space-y-4">
      {filters && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {filters}
        </div>
      )}

      <div className="overflow-hidden rounded-md border bg-background">
        <ShadcnTable className="table-fixed">
          <TableHeader headerGroups={table.getHeaderGroups()} />
          <TableBody
            numberOfColumns={numberOfColumns}
            rows={table.getRowModel().rows}
          />
        </ShadcnTable>
      </div>
      <TablePagination table={table} />
    </div>
  );
}
