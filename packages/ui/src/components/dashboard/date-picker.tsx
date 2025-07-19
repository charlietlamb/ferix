'use client';

import { Button } from '@ferix/ui/components/shadcn/button';
import { Calendar } from '@ferix/ui/components/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@ferix/ui/components/shadcn/popover';
import { cn } from '@ferix/ui/lib/utils';
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

export default function DatePicker() {
  const today = new Date();
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  };
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  };
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  };
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  };
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  };
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  };
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  };
  const [month, setMonth] = useState(today);

  const [date, setDate] = useState<DateRange | undefined>(lastYear);

  return (
    <div className="*:not-first:mt-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button className="min-w-62 justify-start" variant="outline">
            <CalendarIcon
              aria-hidden="true"
              className="-ms-1 shrink-0 opacity-40 transition-colors group-hover:text-foreground"
              size={16}
            />
            <span className={cn('truncate', !date && 'text-muted-foreground')}>
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                'Pick a date range'
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="flex max-sm:flex-col">
            <div className="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
              <div className="h-full sm:border-e">
                <div className="flex flex-col px-2">
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate({
                        from: today,
                        to: today,
                      });
                      setMonth(today);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Today
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(yesterday);
                      setMonth(yesterday.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Yesterday
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(last7Days);
                      setMonth(last7Days.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Last 7 days
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(last30Days);
                      setMonth(last30Days.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Last 30 days
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(monthToDate);
                      setMonth(monthToDate.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Month to date
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(lastMonth);
                      setMonth(lastMonth.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Last month
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(yearToDate);
                      setMonth(yearToDate.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Year to date
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setDate(lastYear);
                      setMonth(lastYear.to);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Last year
                  </Button>
                </div>
              </div>
            </div>
            <Calendar
              className="p-2"
              disabled={[
                { after: today }, // Dates before today
              ]}
              mode="range"
              month={month}
              onMonthChange={setMonth}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                }
              }}
              selected={date}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
