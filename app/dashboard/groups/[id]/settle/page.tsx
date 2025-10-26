import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SettleTransactionsViewServer } from "@/components/settlements/settle-transactions-view-server";
import { calculateBalances } from "@/lib/utils/balance-calculator";
import { optimizeSettlements } from "@/lib/utils/settlement-optimizer";

interface SettlePageProps {
  params: Promise<{ id: string }>;
}

export default async function SettlePage({ params }: SettlePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch group data
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) {
    redirect("/dashboard/groups");
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership && group.created_by !== user.id) {
    redirect("/dashboard/groups");
  }

  // Fetch group members
  const { data: memberRecords } = await supabase
    .from("group_members")
    .select("user_id, users!inner(id, email, name, avatar_url, created_at)")
    .eq("group_id", id);

  let allMembers: any[] = [];

  if (memberRecords && memberRecords.length > 0) {
    allMembers = memberRecords.map((member: any) => member.users);
  }

  // Ensure current user is included
  const currentUserExists = allMembers.some((m) => m.id === user.id);
  if (!currentUserExists) {
    const { data: currentUser } = await supabase
      .from("users")
      .select("id, email, name, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    if (currentUser) {
      allMembers.unshift(currentUser);
    }
  }

  // Fetch expenses with splits
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  // Fetch splits separately
  const { data: splits } = await supabase
    .from("expense_splits")
    .select("*")
    .in("expense_id", expenses?.map((e) => e.id) || []);

  // Create a members map for fast lookup
  const membersMap = new Map(allMembers.map((m) => [m.id, m]));

  // Combine expenses with payer and splits data
  let expensesWithPayer = expenses;
  if (expenses && expenses.length > 0) {
    expensesWithPayer = expenses.map((expense) => {
      // Add payer info
      const payer = membersMap.get(expense.payer_id);

      // Add splits with user info
      const expenseSplits = splits
        ?.filter((split) => split.expense_id === expense.id)
        .map((split) => ({
          ...split,
          user: membersMap.get(split.user_id),
        }));

      return {
        ...expense,
        payer,
        splits: expenseSplits || [],
      };
    });
  }

  // Calculate balances and settlements
  const balances = calculateBalances(expensesWithPayer || []);
  const settlements = optimizeSettlements(balances);

  // Create users map for the component
  const usersMap = new Map(allMembers.map((u) => [u.id, u]));

  // Check if group is already settled
  const isSettled = !!group.settled_at;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 space-y-4">
        <Button
          className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
          asChild
        >
          <Link href={`/dashboard/groups/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Group
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Settle Transactions
            </h1>
            <p className="text-muted-foreground">
              Review and execute payments for {group.name}
            </p>
          </div>
          {isSettled && (
            <Badge
              variant="outline"
              className="bg-chart-5/10 text-chart-5 border-chart-5/20"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Settled
            </Badge>
          )}
        </div>
      </div>

      {isSettled ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="mb-4 h-16 w-16 text-chart-5" />
            <h3 className="mb-2 text-lg font-semibold">
              Group Already Settled
            </h3>
            <p className="text-center text-sm text-muted-foreground mb-4">
              This group was settled on{" "}
              {new Date(group.settled_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <Button asChild variant="outline">
              <Link href={`/dashboard/groups/${id}`}>View Group Details</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SettleTransactionsViewServer
          settlements={settlements}
          currency={group.currency}
          groupId={id}
          usersMap={usersMap}
        />
      )}
    </div>
  );
}
