import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupHeader } from '@/components/groups/group-header';
import { ExpensesList } from '@/components/expenses/expenses-list';
import { AddExpenseForm } from '@/components/expenses/add-expense-form';
import { BalanceView } from '@/components/balances/balance-view';
import { GroupSummaryView } from '@/components/summaries/group-summary-view';

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch group data
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (!group) {
    redirect('/dashboard/groups');
  }

  // Check if user is a member
  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single();

  console.log('Membership check:', { membership, membershipError });

  // If no membership found, check if user is the group creator
  if (!membership) {
    console.log('No membership found, checking if user is group creator...');
    if (group.created_by !== user.id) {
      console.log('User is not a member or creator, redirecting...');
      redirect('/dashboard/groups');
    } else {
      console.log('User is group creator, allowing access');
    }
  }

  // Fetch group members
  const { data: members } = await supabase
    .from('group_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('group_id', id);

  // Fetch expenses with splits - use the working simple query and add joins manually
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      *,
      splits:expense_splits(*)
    `)
    .eq('group_id', id)
    .order('created_at', { ascending: false });

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
      <GroupHeader group={group} members={members || []} currentUserId={user.id} />

      <Tabs defaultValue="expenses" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          <AddExpenseForm 
            groupId={id} 
            members={members || []} 
            currentUserId={user.id}
            currency={group.currency}
          />
          <ExpensesList 
            expenses={expensesWithPayer || []} 
            currentUserId={user.id}
            currency={group.currency}
          />
          
        </TabsContent>

        <TabsContent value="balances">
          <BalanceView 
            expenses={expensesWithPayer || []} 
            groupId={id}
            currency={group.currency}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="summary">
          <GroupSummaryView 
            expenses={expensesWithPayer || []} 
            groupName={group.name}
            groupId={id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

