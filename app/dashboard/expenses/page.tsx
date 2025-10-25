import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ExpensesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's group IDs
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const groupIds = memberships?.map((m) => m.group_id) || [];

  // Fetch all expenses from user's groups
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      *,
      group:groups(name, currency)
    `)
    .in('group_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(50);

  // Log error for debugging
  if (expensesError) {
    console.error('Error fetching expenses:', expensesError);
  }

  // If we have expenses, fetch payer information separately
  let expensesWithPayer = expenses;
  if (expenses && expenses.length > 0) {
    // Get unique payer IDs
    const payerIds = [...new Set(expenses.map(exp => exp.payer_id))];
    
    // Fetch payer information
    const { data: payers } = await supabase
      .from('users')
      .select('*')
      .in('id', payerIds);
    
    // Create a map for quick lookup
    const payerMap = new Map(payers?.map(p => [p.id, p]) || []);
    
    // Merge payer data with expenses
    expensesWithPayer = expenses.map(expense => ({
      ...expense,
      payer: payerMap.get(expense.payer_id)
    }));
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Expenses</h1>
        <p className="text-muted-foreground">Recent expenses across all your groups</p>
      </div>

      {!expensesWithPayer || expensesWithPayer.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No expenses yet</h3>
            <p className="text-center text-sm text-muted-foreground">
              Create a group and add your first expense to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expensesWithPayer.map((expense) => (
            <Link
              key={expense.id}
              href={`/dashboard/groups/${expense.group_id}`}
              className="block"
            >
              <Card className="transition-all hover:shadow-md">
                <CardContent className="flex items-start justify-between p-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{expense.description}</h3>
                      {expense.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                          {expense.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {expense.group?.name} · Paid by {expense.payer?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(expense.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {formatCurrency(Number(expense.amount), expense.group?.currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

