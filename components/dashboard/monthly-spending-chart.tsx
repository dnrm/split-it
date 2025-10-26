'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface MonthlySpendingData {
  month: string;
  amount: number;
  count: number;
}

interface MonthlySpendingChartProps {
  data: MonthlySpendingData[];
  currency: string;
}

const chartConfig = {
  amount: {
    label: 'Amount Spent',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function MonthlySpendingChart({ data, currency }: MonthlySpendingChartProps) {
  const isMobile = useIsMobile();
  
  if (!data || data.length === 0) {
    return (
      <Card className="rounded-none shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Monthly Spending</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your spending by month</CardDescription>
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
        <CardTitle className="text-base sm:text-lg">Monthly Spending</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your spending over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[150px]' : 'h-[180px]'} w-full max-w-full overflow-hidden`}>
          <BarChart 
            data={data}
            margin={isMobile ? { left: 30, right: 5, top: 10, bottom: 10 } : { left: 60, right: 20, top: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickLine={false}
              axisLine={false}
              fontSize={isMobile ? 10 : 12}
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
                  formatter={(value) => [`${currency}${value}`, 'Amount Spent']}
                />
              }
            />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 25 : 40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
