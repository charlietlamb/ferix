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
  { month: 'Jan 2025', individual: 2000, team: 1000, enterprise: 1000 },
  { month: 'Feb 2025', individual: 800, team: 4500, enterprise: 1700 },
  { month: 'Mar 2025', individual: 400, team: 4600, enterprise: 1000 },
  { month: 'Apr 2025', individual: 1800, team: 4700, enterprise: 2000 },
  { month: 'May 2025', individual: 1800, team: 6000, enterprise: 4000 },
  { month: 'Jun 2025', individual: 2500, team: 6000, enterprise: 1500 },
  { month: 'Jul 2025', individual: 1000, team: 2500, enterprise: 1000 },
  { month: 'Aug 2025', individual: 2000, team: 4000, enterprise: 2500 },
  { month: 'Sep 2025', individual: 4500, team: 7000, enterprise: 3000 },
  { month: 'Oct 2025', individual: 2500, team: 3000, enterprise: 3500 },
  { month: 'Nov 2025', individual: 500, team: 1500, enterprise: 1000 },
  { month: 'Dec 2025', individual: 2000, team: 3000, enterprise: 1500 },
];

const chartConfig = {
  individual: {
    label: 'Individual',
    color: 'var(--chart-4)',
  },
  team: {
    label: 'Team',
    color: 'var(--chart-1)',
  },
  enterprise: {
    label: 'Enterprise',
    color: 'var(--chart-6)',
  },
} satisfies ChartConfig;

export function Chart05() {
  const id = useId();

  // Get first and last month with type assertions
  const firstMonth = chartData[0]?.month as string;
  const lastMonth = chartData.at(-1)?.month as string;

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Subscriptions Sold</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">12,296</div>
              <Badge className="mt-1.5 border-none bg-emerald-500/24 text-emerald-500">
                +11.9%
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-4"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Individual
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-1"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">Team</div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-6"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Enterprise
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
                value === 0 ? '0' : `${(value / 1000).toFixed(0)}K`
              }
              tickLine={false}
            />
            <ChartTooltip
              content={
                <CustomTooltipContent
                  colorMap={{
                    individual: 'var(--chart-4)',
                    team: 'var(--chart-1)',
                    enterprise: 'var(--chart-6)',
                  }}
                  dataKeys={['individual', 'team', 'enterprise']}
                  labelMap={{
                    individual: 'Individual',
                    team: 'Team',
                    enterprise: 'Enterprise',
                  }}
                  valueFormatter={(value) => `$${value.toLocaleString()}`}
                />
              }
            />
            <Bar dataKey="individual" fill="var(--chart-4)" stackId="a" />
            <Bar dataKey="team" fill={`url(#${id}-gradient)`} stackId="a" />
            <Bar dataKey="enterprise" fill="var(--chart-6)" stackId="a" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
