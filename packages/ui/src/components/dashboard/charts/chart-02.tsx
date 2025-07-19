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
import {
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  XAxis,
  YAxis,
} from 'recharts';

// Subscriber data for the last 12 months
const chartData = [
  { month: 'Jan 2025', actual: 5000, projected: 2000 },
  { month: 'Feb 2025', actual: 10_000, projected: 8000 },
  { month: 'Mar 2025', actual: 15_000, projected: 22_000 },
  { month: 'Apr 2025', actual: 22_000, projected: 15_000 },
  { month: 'May 2025', actual: 20_000, projected: 25_000 },
  { month: 'Jun 2025', actual: 35_000, projected: 45_000 },
  { month: 'Jul 2025', actual: 30_000, projected: 25_000 },
  { month: 'Aug 2025', actual: 60_000, projected: 70_000 },
  { month: 'Sep 2025', actual: 65_000, projected: 75_000 },
  { month: 'Oct 2025', actual: 60_000, projected: 80_000 },
  { month: 'Nov 2025', actual: 70_000, projected: 65_000 },
  { month: 'Dec 2025', actual: 78_000, projected: 75_000 },
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

interface CustomCursorProps {
  fill?: string;
  pointerEvents?: string;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  className?: string;
}

function CustomCursor(props: CustomCursorProps) {
  const { fill, pointerEvents, height, points, className } = props;

  if (!points || points.length === 0) {
    return null;
  }

  const { x, y } = points[0];
  if (!(x && y)) {
    return null;
  }
  return (
    <>
      <Rectangle
        className={className}
        fill={fill}
        height={height}
        pointerEvents={pointerEvents}
        type="linear"
        width={24}
        x={x - 12}
        y={y}
      />
      <Rectangle
        className="recharts-tooltip-inner-cursor"
        fill={fill}
        height={height}
        pointerEvents={pointerEvents}
        type="linear"
        width={1}
        x={x - 1}
        y={y}
      />
    </>
  );
}

export function Chart02() {
  const id = useId();

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Active Subscribers</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">142,869</div>
              <Badge className="mt-1.5 border-none bg-emerald-500/24 text-emerald-500">
                +24.7%
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
                Actual
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-3"
              />
              <div className="text-[13px]/3 text-muted-foreground/50">
                Projected
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-(--chart-1)/15 [&_.recharts-rectangle.recharts-tooltip-inner-cursor]:fill-white/20"
          config={chartConfig}
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: -12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id={`${id}-gradient`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--chart-2)" />
                <stop offset="100%" stopColor="var(--chart-1)" />
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
              tickFormatter={(value) => value.slice(0, 3)}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                if (value === 0) {
                  return '$0';
                }
                return `${value / 1000}k`;
              }}
              tickLine={false}
            />
            <Line
              activeDot={false}
              dataKey="projected"
              dot={false}
              stroke="var(--color-projected)"
              strokeWidth={2}
              type="linear"
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
              cursor={<CustomCursor fill="var(--chart-1)" />}
            />
            <Line
              activeDot={{
                r: 5,
                fill: 'var(--chart-1)',
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
              dataKey="actual"
              dot={false}
              stroke={`url(#${id}-gradient)`}
              strokeWidth={2}
              type="linear"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
