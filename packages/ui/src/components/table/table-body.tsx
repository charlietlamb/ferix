'use client';

import { Checkbox } from '@ferix/ui/components/shadcn/checkbox';
import {
  TableBody as ShadcnTableBody,
  TableCell,
  TableRow,
} from '@ferix/ui/components/shadcn/table';
import { flexRender, type Row } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface TableBodyProps<T> {
  rows: Row<T>[];
  numberOfColumns: number;
  enableSelection: boolean;
}

export function TableBody<TData>({
  rows,
  numberOfColumns,
  enableSelection,
}: TableBodyProps<TData>) {
  const t = useTranslations('table');

  if (!rows.length) {
    return (
      <ShadcnTableBody>
        <TableRow>
          <TableCell className="h-24 text-center" colSpan={numberOfColumns}>
            {t('no-results')}
          </TableCell>
        </TableRow>
      </ShadcnTableBody>
    );
  }

  return (
    <ShadcnTableBody>
      {rows.map((row) => (
        <TableRow
          className="min-h-10 hover:bg-muted/50"
          data-state={row.getIsSelected() && 'selected'}
          key={row.id}
        >
          {enableSelection && (
            <TableCell className="w-[50px]">
              <Checkbox
                aria-label={t('selection.select-row')}
                checked={row.getIsSelected()}
                onCheckedChange={(checked) => row.toggleSelected(!!checked)}
              />
            </TableCell>
          )}
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </ShadcnTableBody>
  );
}
