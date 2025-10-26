'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

interface GroupSpendingData {
  name: string;
  value: number;
  color?: string;
}

interface GroupSpendingChartProps {
  data: GroupSpendingData[];
  currency: string;
}

const chartConfig = {
  value: {
    label: 'Amount Spent',
  },
} satisfies ChartConfig;

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function GroupSpendingChart({ data, currency }: GroupSpendingChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="rounded-none shadow-xs">
        <CardHeader>
          <CardTitle>Spending by Group</CardTitle>
          <CardDescription>Breakdown of expenses by group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Group</CardTitle>
        <CardDescription>Breakdown of expenses by group</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              innerRadius={20}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${currency}${value}`, 'Amount']}
                />
              }
            />
            <ChartLegend
              content={
                <ChartLegendContent
                  nameKey="name"
                  formatter={(value) => value}
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
