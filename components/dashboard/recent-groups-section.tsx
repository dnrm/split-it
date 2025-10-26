"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Plus, TrendingUp, Receipt } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  currency: string;
  created_at: string;
  expenses?: Array<{ id: string; amount: number }>;
}

interface RecentGroupsSectionProps {
  groups: Group[];
  totalSpent: number;
  totalExpenses: number;
}

export function RecentGroupsSection({
  groups,
  totalSpent,
  totalExpenses,
}: RecentGroupsSectionProps) {
  const recentGroups = groups.slice(0, 3);

  if (!groups || groups.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Groups
          </CardTitle>
          <CardDescription>
            Get started by creating your first expense group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No groups yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Create your first group to start tracking shared expenses with
              friends or family
            </p>
            <Button
              className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
              asChild
            >
              <Link href="/dashboard/groups/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Group
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-4">
      {/* Quick Stats */}
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="rounded-none shadow-xs bg-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Total groups</p>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-xs bg-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses}</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-xs bg-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">Combined spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Groups */}
      <Card className="rounded-none shadow-xs bg-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Groups
              </CardTitle>
              <CardDescription>
                Quick access to your most active groups
              </CardDescription>
            </div>
            <Button
              className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
              size="sm"
              asChild
            >
              <Link href="/dashboard/groups">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-4 ${
              recentGroups.length < 3
                ? "grid-cols-1 md:grid-cols-2"
                : "md:grid-cols-3"
            }`}
          >
            {recentGroups.map((group) => {
              const groupTotal =
                group.expenses?.reduce(
                  (sum, exp) => sum + Number(exp.amount),
                  0
                ) || 0;
              const expenseCount = group.expenses?.length || 0;

              return (
                <Link
                  key={group.id}
                  href={`/dashboard/groups/${group.id}`}
                  className="bg-background group block rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDate(group.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {group.currency}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Spent</span>
                      <span className="font-semibold">
                        {formatCurrency(groupTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-medium">{expenseCount}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    <span>View Details</span>
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {groups.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/groups">
                  View {groups.length - 3} more groups
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
