import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Receipt, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's groups
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(user_id),
      expenses(id, amount)
    `)
    .eq('group_members.user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch recent expenses across all groups
  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select(`
      *,
      group:groups(name)
    `)
    .in(
      'group_id',
      groups?.map((g) => g.id) || []
    )
    .order('created_at', { ascending: false })
    .limit(5);

  // If we have expenses, fetch payer information separately
  let recentExpensesWithPayer = recentExpenses;
  if (recentExpenses && recentExpenses.length > 0) {
    // Get unique payer IDs
    const payerIds = [...new Set(recentExpenses.map(exp => exp.payer_id))];
    
    // Fetch payer information
    const { data: payers } = await supabase
      .from('users')
      .select('*')
      .in('id', payerIds);
    
    // Create a map for quick lookup
    const payerMap = new Map(payers?.map(p => [p.id, p]) || []);
    
    // Merge payer data with expenses
    recentExpensesWithPayer = recentExpenses.map(expense => ({
      ...expense,
      payer: payerMap.get(expense.payer_id)
    }));
  }

  // Calculate stats
  const totalGroups = groups?.length || 0;
  const totalExpenses = groups?.reduce((sum, g) => sum + (g.expenses?.length || 0), 0) || 0;
  const totalSpent = groups?.reduce(
    (sum, g) => sum + (g.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0),
    0
  ) || 0;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.user_metadata?.name || 'User'}!</p>
        </div>
        <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' asChild>
          <Link href="/dashboard/groups/create">
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">Active expense groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses}</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Combined group spending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Groups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Groups</CardTitle>
                <CardDescription>Groups you're a member of</CardDescription>
              </div>
              <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' size="sm" asChild>
                <Link href="/dashboard/groups">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!groups || groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">No groups yet</p>
                <p className="mb-4 text-xs text-muted-foreground">Create your first group to start tracking expenses</p>
                <Button size="sm" className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' asChild>
                  <Link href="/dashboard/groups/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.slice(0, 3).map((group) => (
                  <Link
                    key={group.id}
                    href={`/dashboard/groups/${group.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.expenses?.length || 0} expense{group.expenses?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDate(group.created_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest expenses across all groups</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentExpensesWithPayer || recentExpensesWithPayer.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">No expenses yet</p>
                <p className="text-xs text-muted-foreground">Add your first expense to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpensesWithPayer.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.group?.name} · Paid by {expense.payer?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(expense.amount))}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(expense.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

