import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnimatedDashboardHeader } from "@/components/dashboard/animated-dashboard-header";
import { AnimatedStatsCards } from "@/components/dashboard/animated-stats-cards";
import { AnimatedRecentExpenses } from "@/components/dashboard/animated-recent-expenses";
import { RecentGroupsSection } from "@/components/dashboard/recent-groups-section";
import { RecentGroupsCharts } from "@/components/dashboard/recent-groups-charts";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's groups with detailed expense data
  const { data: groups } = await supabase
    .from("groups")
    .select(
      `
      *,
      group_members!inner(user_id),
      expenses(id, amount, created_at)
    `
    )
    .eq("group_members.user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch recent expenses across all groups for the recent expenses section
  const { data: recentExpenses } = await supabase
    .from("expenses")
    .select(
      `
      *,
      group:groups(name)
    `
    )
    .in("group_id", groups?.map((g) => g.id) || [])
    .order("created_at", { ascending: false })
    .limit(5);

  // If we have expenses, fetch payer information separately
  let recentExpensesWithPayer = recentExpenses;
  if (recentExpenses && recentExpenses.length > 0) {
    // Get unique payer IDs
    const payerIds = [...new Set(recentExpenses.map((exp) => exp.payer_id))];

    // Fetch payer information
    const { data: payers } = await supabase
      .from("users")
      .select("*")
      .in("id", payerIds);

    // Create a map for quick lookup
    const payerMap = new Map(payers?.map((p) => [p.id, p]) || []);

    // Merge payer data with expenses
    recentExpensesWithPayer = recentExpenses.map((expense) => ({
      ...expense,
      payer: payerMap.get(expense.payer_id),
    }));
  }

  // Calculate stats
  const totalGroups = groups?.length || 0;
  const totalExpenses =
    groups?.reduce((sum, g) => sum + (g.expenses?.length || 0), 0) || 0;
  const totalSpent =
    groups?.reduce(
      (sum, g) =>
        sum +
        (g.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) ||
          0),
      0
    ) || 0;

  // Get the most common currency from groups
  const primaryCurrency = groups?.[0]?.currency || "USD";

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <AnimatedDashboardHeader userName={user.user_metadata?.name} />

      {/* Stats Cards
      <AnimatedStatsCards 
        totalGroups={totalGroups}
        totalExpenses={totalExpenses}
        totalSpent={totalSpent}
        currency={primaryCurrency}
      /> */}

      {/* Recent Groups Section - Most Important */}
      <RecentGroupsSection
        groups={groups || []}
        totalSpent={totalSpent}
        totalExpenses={totalExpenses}
      />

      {/* Charts for Recent Groups */}
      {groups && groups.length > 0 && (
        <div className="mb-8">
          <RecentGroupsCharts
            groups={groups.slice(0, 3)}
            currency={primaryCurrency}
          />
        </div>
      )}

      {/* Recent Expenses */}
      <AnimatedRecentExpenses expenses={recentExpensesWithPayer || []} />
    </div>
  );
}
