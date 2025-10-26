"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface GroupData {
  id: string;
  name: string;
  currency: string;
  expenses: Array<{ amount: number; created_at: string }>;
}

interface RecentGroupsChartsProps {
  groups: GroupData[];
  currency: string;
}

const chartConfig = {
  amount: {
    label: "Amount Spent",
    color: "hsl(var(--primary))",
  },
  value: {
    label: "Amount Spent",
  },
} satisfies ChartConfig;

const COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
];

// Format numbers to compact notation (e.g., 3.4M, 45k)
const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  } else {
    return value.toString();
  }
};

export function RecentGroupsCharts({
  groups,
  currency,
}: RecentGroupsChartsProps) {
  const isMobile = useIsMobile();
  
  if (!groups || groups.length === 0) {
    return null;
  }

  // Process data for recent groups (max 3)
  const recentGroups = groups.slice(0, 3);

  // Calculate spending by group
  const groupSpendingData = recentGroups
    .map((group, index) => {
      const totalSpent =
        group.expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      return {
        name: group.name,
        value: totalSpent,
        fill: COLORS[index % COLORS.length],
        color: COLORS[index % COLORS.length],
      };
    })
    .filter((item) => item.value > 0); // Only include groups with spending

  // Calculate monthly spending for recent groups
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const monthExpenses = recentGroups.flatMap((group) =>
      (group.expenses || []).filter((exp) =>
        exp.created_at.startsWith(monthKey)
      )
    );

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      amount: monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    };
  });

  return (
    <div className="grid gap-3 sm:gap-6 lg:grid-cols-2 w-full">
      {/* Group Spending Breakdown */}
      <Card className="rounded-none shadow-xs bg-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Spending by Recent Groups
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Breakdown of expenses in your most active groups
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {groupSpendingData.length === 0 ? (
            <div className={`flex ${isMobile ? 'h-[200px]' : 'h-[250px]'} items-center justify-center text-muted-foreground px-4 sm:px-6`}>
              <div className="text-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No spending data available</p>
                <p className="text-xs text-muted-foreground">
                  Add expenses to see breakdown
                </p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[250px]'} w-full max-w-full overflow-hidden`}>
              <PieChart>
                <Pie
                  data={groupSpendingData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 50 : 80}
                  innerRadius={isMobile ? 15 : 30}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {groupSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `${currency}${formatCompactNumber(Number(value))}`,
                        "Amount",
                      ]}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey="name"
                      payload={groupSpendingData}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Monthly Spending Trend */}
      <Card className="rounded-none shadow-xs bg-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Monthly Spending Trend
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Spending in your recent groups over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {monthlyData.every((month) => month.amount === 0) ? (
            <div className={`flex ${isMobile ? 'h-[200px]' : 'h-[250px]'} items-center justify-center text-muted-foreground px-4 sm:px-6`}>
              <div className="text-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No spending data available</p>
                <p className="text-xs text-muted-foreground">
                  Add expenses to see trends
                </p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[250px]'} w-full max-w-full overflow-hidden`}>
              <BarChart 
                data={monthlyData} 
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
                  tickFormatter={(value) =>
                    `${currency}${formatCompactNumber(value)}`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `${currency}${formatCompactNumber(Number(value))}`,
                      ]}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
