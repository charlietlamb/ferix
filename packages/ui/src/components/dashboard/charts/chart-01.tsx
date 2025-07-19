'use client';

import { CustomTooltipContent } from '@ferix/ui/components/dashboard/charts/charts-extra';
import { Badge } from '@ferix/ui/components/shadcn/badge';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ferix/ui/components/shadcn/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@ferix/ui/components/shadcn/chart';
import {
  RadioGroup,
  RadioGroupItem,
} from '@ferix/ui/components/shadcn/radio-group';
import { useId, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const mrrData = [
  { month: 'Jan 2025', actual: 300_000, projected: 120_000 },
  { month: 'Feb 2025', actual: 420_000, projected: 180_000 },
  { month: 'Mar 2025', actual: 500_000, projected: 90_000 },
  { month: 'Apr 2025', actual: 630_000, projected: 110_000 },
  { month: 'May 2025', actual: 710_000, projected: 120_000 },
  { month: 'Jun 2025', actual: 800_000, projected: 100_000 },
  { month: 'Jul 2025', actual: 900_000, projected: 140_000 },
  { month: 'Aug 2025', actual: 1_010_000, projected: 120_000 },
  { month: 'Sep 2025', actual: 1_090_000, projected: 130_000 },
  { month: 'Oct 2025', actual: 1_180_000, projected: 110_000 },
  { month: 'Nov 2025', actual: 1_280_000, projected: 130_000 },
  { month: 'Dec 2025', actual: 1_380_000, projected: 100_000 },
];

const arrData = [
  { month: 'Jan 2025', actual: 3_600_000, projected: 1_440_000 },
  { month: 'Feb 2025', actual: 4_200_000, projected: 1_800_000 },
  { month: 'Mar 2025', actual: 5_000_000, projected: 900_000 },
  { month: 'Apr 2025', actual: 6_300_000, projected: 1_100_000 },
  { month: 'May 2025', actual: 7_100_000, projected: 1_200_000 },
  { month: 'Jun 2025', actual: 8_000_000, projected: 1_000_000 },
  { month: 'Jul 2025', actual: 9_000_000, projected: 1_400_000 },
  { month: 'Aug 2025', actual: 10_100_000, projected: 1_200_000 },
  { month: 'Sep 2025', actual: 10_900_000, projected: 1_300_000 },
  { month: 'Oct 2025', actual: 11_800_000, projected: 1_100_000 },
  { month: 'Nov 2025', actual: 12_800_000, projected: 1_300_000 },
  { month: 'Dec 2025', actual: 16_560_000, projected: 1_200_000 },
];

const chartConfig = {
  actual: {
    label: 'Actual',
    color: 'var(--chart-1)',
  },
  projected: {
    label: 'Projected',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function Chart01() {
  const id = useId();
  const [selectedValue, setSelectedValue] = useState('off');

  const chartData = selectedValue === 'on' ? arrData : mrrData;

  const firstMonth = chartData[0]?.month as string;
  const lastMonth = chartData.at(-1)?.month as string;

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle>Recurring Revenue</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">
                {selectedValue === 'off' ? '$1,439,346' : '$8,272,152'}
              </div>
              <Badge className="mt-1.5 border-none bg-emerald-500/24 text-emerald-500">
                {selectedValue === 'off' ? '+48.1%' : '+52.7%'}
              </Badge>
            </div>
          </div>
          <div className="inline-flex h-7 shrink-0 rounded-lg bg-black/50 p-0.5">
            <RadioGroup
              className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 font-medium text-xs after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:border after:border-border after:bg-background after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 has-focus-visible:after:border-ring has-focus-visible:after:ring-[3px] has-focus-visible:after:ring-ring/50 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
              data-state={selectedValue}
              onValueChange={setSelectedValue}
              value={selectedValue}
            >
              <label
                className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-2 transition-colors group-data-[state=on]:text-muted-foreground/50"
                htmlFor={`${id}-1`}
              >
                MRR
                <RadioGroupItem
                  className="sr-only"
                  id={`${id}-1`}
                  value="off"
                />
              </label>
              <label
                className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-2 transition-colors group-data-[state=off]:text-muted-foreground/50"
                htmlFor={`${id}-2`}
              >
                ARR
                <RadioGroupItem className="sr-only" id={`${id}-2`} value="on" />
              </label>
            </RadioGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--chart-1)]/15"
          config={chartConfig}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: -12, right: 12, top: 12 }}
            maxBarSize={20}
          >
            <defs>
              <linearGradient id={`${id}-gradient`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" />
                <stop offset="100%" stopColor="var(--chart-2)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="2 2"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="var(--border)"
              tickLine={false}
              tickMargin={12}
              ticks={[firstMonth, lastMonth]}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value) =>
                value === 0 ? '$0' : `$${(value / 1_000_000).toFixed(1)}M`
              }
              tickLine={false}
            />
            <ChartTooltip
              content={
                <CustomTooltipContent
                  colorMap={{
                    actual: 'var(--chart-1)',
                    projected: 'var(--chart-3)',
                  }}
                  dataKeys={['actual', 'projected']}
                  labelMap={{
                    actual: 'Actual',
                    projected: 'Projected',
                  }}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                />
              }
            />
            <Bar dataKey="actual" fill={`url(#${id}-gradient)`} stackId="a" />
            <Bar
              dataKey="projected"
              fill="var(--color-projected)"
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
