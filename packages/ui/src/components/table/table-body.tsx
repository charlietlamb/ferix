'use client';

import { Checkbox } from '@ferix/ui/components/shadcn/checkbox';
import {
  TableBody as ShadcnTableBody,
  TableCell,
  TableRow,
} from '@ferix/ui/components/shadcn/table';
import { flexRender, type Row } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Skeleton } from '../shadcn/skeleton';

interface TableBodyProps<T> {
  rows: Row<T>[];
  numberOfColumns: number;
  enableSelection: boolean;
  isLoading: boolean;
}

export function TableBody<TData>({
  rows,
  numberOfColumns,
  enableSelection,
  isLoading,
}: TableBodyProps<TData>) {
  const t = useTranslations('table');

  if (!rows.length) {
    return (
      <ShadcnTableBody>
        {isLoading ? (
          new Array(10).fill(0).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: just a placeholder
            <TableRow key={index}>
              {new Array(numberOfColumns).fill(0).map((__, cellIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: just a placeholder
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              className="h-24 w-full text-center"
              colSpan={numberOfColumns}
            >
              {t('no-results')}
            </TableCell>
          </TableRow>
        )}
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
