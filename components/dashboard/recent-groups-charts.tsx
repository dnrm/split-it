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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Group Spending Breakdown */}
      <Card className="rounded-none shadow-xs bg-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Spending by Recent Groups
          </CardTitle>
          <CardDescription>
            Breakdown of expenses in your most active groups
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {groupSpendingData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground px-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No spending data available</p>
                <p className="text-xs text-muted-foreground">
                  Add expenses to see breakdown
                </p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={groupSpendingData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Spending Trend
          </CardTitle>
          <CardDescription>
            Spending in your recent groups over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {monthlyData.every((month) => month.amount === 0) ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground px-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No spending data available</p>
                <p className="text-xs text-muted-foreground">
                  Add expenses to see trends
                </p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData} margin={{ left: 60, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
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
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
