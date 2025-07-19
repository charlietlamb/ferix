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
import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartData = [
  { month: 'Jan 2025', revenues: 750_000, churn: -150_000 },
  { month: 'Feb 2025', revenues: 900_000, churn: -70_000 },
  { month: 'Mar 2025', revenues: 950_000, churn: -220_000 },
  { month: 'Apr 2025', revenues: 1_350_000, churn: -180_000 },
  { month: 'May 2025', revenues: 650_000, churn: -80_000 },
  { month: 'Jun 2025', revenues: 1_450_000, churn: -280_000 },
  { month: 'Jul 2025', revenues: 950_000, churn: -150_000 },
  { month: 'Aug 2025', revenues: 500_000, churn: -120_000 },
  { month: 'Sep 2025', revenues: 1_300_000, churn: -280_000 },
  { month: 'Oct 2025', revenues: 1_050_000, churn: -40_000 },
  { month: 'Nov 2025', revenues: 1_550_000, churn: -120_000 },
  { month: 'Dec 2025', revenues: 900_000, churn: -200_000 },
];

const chartConfig = {
  revenues: {
    label: 'Revenues',
    color: 'var(--chart-1)',
  },
  churn: {
    label: 'Churn',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

export function Chart03() {
  const id = useId();

  // Get first and last month with type assertions
  const firstMonth = chartData[0]?.month as string;
  const lastMonth = chartData.at(-1)?.month as string;

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>MRR Growth</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">$1,426,297</div>
              <Badge className="mt-1.5 border-none bg-emerald-500/24 text-emerald-500">
                +4.6%
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-1"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Revenues
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-4"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Churn
              </div>
            </div>
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
            stackOffset="sign"
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
                    revenues: 'var(--chart-1)',
                    churn: 'var(--chart-4)',
                  }}
                  dataKeys={['revenues', 'churn']}
                  labelMap={{
                    revenues: 'Revenues',
                    churn: 'Churn',
                  }}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                />
              }
            />
            <Bar dataKey="revenues" fill={`url(#${id}-gradient)`} stackId="a" />
            <Bar dataKey="churn" fill="var(--color-churn)" stackId="a" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
