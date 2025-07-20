import { Button } from '@ferix/ui/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@ferix/ui/components/shadcn/dropdown-menu';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { Columns3Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function TableColumnVisibility<T>({
  table,
}: {
  table: TanstackTable<T>;
}) {
  const t = useTranslations('table');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Columns3Icon
            aria-hidden="true"
            className="-ms-1 opacity-60"
            size={16}
          />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-foreground text-xs">
          {t('column-visibility')}
        </DropdownMenuLabel>
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                checked={column.getIsVisible()}
                className="capitalize"
                key={column.id}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(event) => event.preventDefault()}
              >
                {typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
