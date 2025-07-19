import {
  TableBody as ShadcnTableBody,
  TableCell,
  TableRow,
} from '@ferix/ui/components/shadcn/table';
import { flexRender, type Row } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface TableBodyProps<TData> {
  rows: Row<TData>[];
  numberOfColumns: number;
}

export function TableBody<TData>({
  rows,
  numberOfColumns,
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
        <TableRow data-state={row.getIsSelected() && 'selected'} key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <TableCell className="last:py-0" key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </ShadcnTableBody>
  );
}
