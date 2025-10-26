'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExpenseTrendData {
  date: string;
  amount: number;
  count: number;
}

interface ExpenseTrendChartProps {
  data: ExpenseTrendData[];
  currency: string;
}

const chartConfig = {
  amount: {
    label: 'Amount Spent',
    color: 'hsl(var(--primary))',
  },
  count: {
    label: 'Number of Expenses',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ExpenseTrendChart({ data, currency }: ExpenseTrendChartProps) {
  const isMobile = useIsMobile();
  
  if (!data || data.length === 0) {
    return (
      <Card className="rounded-none shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Expense Trends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex ${isMobile ? 'h-[150px]' : 'h-[180px]'} items-center justify-center text-muted-foreground`}>
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Expense Trends</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your spending over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[150px]' : 'h-[180px]'} w-full max-w-full overflow-hidden`}>
          <AreaChart 
            data={data}
            margin={isMobile ? { left: 40, right: 10, top: 10, bottom: 10 } : { left: 60, right: 20, top: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              fontSize={isMobile ? 10 : 12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              fontSize={isMobile ? 10 : 12}
              tickFormatter={(value) => `${currency}${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    name === 'amount' ? `${currency}${value}` : value,
                    name === 'amount' ? 'Amount' : 'Count',
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--color-amount)"
              fill="var(--color-amount)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
