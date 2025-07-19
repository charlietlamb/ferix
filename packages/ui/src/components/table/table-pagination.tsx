import { Button } from '@ferix/ui/components/shadcn/button';
import { Label } from '@ferix/ui/components/shadcn/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@ferix/ui/components/shadcn/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ferix/ui/components/shadcn/select';
import type { Table } from '@tanstack/react-table';
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

export function TablePagination<T>({ table }: { table: Table<T> }) {
  const id = useId();
  const t = useTranslations('table.pagination');
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex items-center gap-3">
        <Label className="max-sm:sr-only" htmlFor={id}>
          {t('rows-per-page')}
        </Label>
        <Select
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
          value={table.getState().pagination.pageSize.toString()}
        >
          <SelectTrigger className="w-fit whitespace-nowrap" id={id}>
            <SelectValue placeholder={t('select-number-of-results')} />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
            {[5, 10, 25, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={pageSize.toString()}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex grow justify-end whitespace-nowrap text-muted-foreground text-sm">
        <p
          aria-live="polite"
          className="whitespace-nowrap text-muted-foreground text-sm"
        >
          <span className="text-foreground">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            -
            {Math.min(
              Math.max(
                table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                0
              ),
              table.getRowCount()
            )}
          </span>{' '}
          {t('of')}
          <span className="text-foreground">
            {table.getRowCount().toString()}
          </span>
        </p>
      </div>

      <div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                aria-label={t('go-to-first-page')}
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.firstPage()}
                size="icon"
                variant="outline"
              >
                <ChevronFirstIcon aria-hidden="true" size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={t('go-to-previous-page')}
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="icon"
                variant="outline"
              >
                <ChevronLeftIcon aria-hidden="true" size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={t('go-to-next-page')}
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="icon"
                variant="outline"
              >
                <ChevronRightIcon aria-hidden="true" size={16} />
              </Button>
            </PaginationItem>
            {/* Last page button */}
            <PaginationItem>
              <Button
                aria-label={t('go-to-last-page')}
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={!table.getCanNextPage()}
                onClick={() => table.lastPage()}
                size="icon"
                variant="outline"
              >
                <ChevronLastIcon aria-hidden="true" size={16} />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
