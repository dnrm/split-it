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

  // Fetch group members with error handling
  let allMembers: any[] = [];
  
  try {
    // First try to get just the group_members data
    const { data: memberRecords, error: memberError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', id);

    console.log('Member records:', memberRecords);
    console.log('Member error:', memberError);

    if (memberError) {
      console.error('Error fetching member records:', memberError);
    } else if (memberRecords && memberRecords.length > 0) {
      // Get user IDs from member records
      const userIds = memberRecords.map(m => m.user_id);
      console.log('User IDs to fetch:', userIds);
      
      // Fetch user data separately
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      console.log('Users data:', users);
      console.log('Users error:', usersError);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        console.log('This might be due to RLS policies. Trying individual user fetches...');
        
        // Fallback: try to fetch each user individually
        const userPromises = userIds.map(async (userId) => {
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
          }
          return user;
        });
        
        const individualUsers = await Promise.all(userPromises);
        const validUsers = individualUsers.filter(user => user !== null);
        console.log('Individual user fetch results:', validUsers);
        
        // Combine member records with user data
        allMembers = memberRecords.map(member => {
          const user = validUsers.find(u => u?.id === member.user_id);
          console.log(`Mapping member ${member.user_id} to user:`, user);
          
          // If we couldn't fetch user data, create a basic user object
          if (!user) {
            console.log(`Creating fallback user object for ${member.user_id}`);
            return {
              ...member,
              user: {
                id: member.user_id,
                name: `User ${member.user_id.slice(0, 8)}`, // Use first 8 chars of ID as fallback name
                email: '',
                created_at: new Date().toISOString()
              }
            };
          }
          
          return {
            ...member,
            user: user
          };
        });
      } else {
        // Combine member records with user data
        allMembers = memberRecords.map(member => {
          const user = users?.find(u => u.id === member.user_id);
          console.log(`Mapping member ${member.user_id} to user:`, user);
          
          // If we couldn't find user data, create a basic user object
          if (!user) {
            console.log(`Creating fallback user object for ${member.user_id}`);
            return {
              ...member,
              user: {
                id: member.user_id,
                name: `User ${member.user_id.slice(0, 8)}`, // Use first 8 chars of ID as fallback name
                email: '',
                created_at: new Date().toISOString()
              }
            };
          }
          
          return {
            ...member,
            user: user
          };
        });
      }
      
      console.log('Combined members:', allMembers);
      console.log('Each member user data:', allMembers.map(m => ({ id: m.user_id, name: m.user?.name, email: m.user?.email })));
      
      // Additional debugging for names
      allMembers.forEach((member, index) => {
        console.log(`Member ${index}:`, {
          user_id: member.user_id,
          user_name: member.user?.name,
          user_email: member.user?.email,
          has_user_data: !!member.user
        });
      });
    }
  } catch (error) {
    console.error('Exception fetching members:', error);
    allMembers = [];
  }

  // Always ensure current user is included
  const currentUserExists = allMembers.some(m => m.user_id === user.id);
  console.log('Current user exists in members:', currentUserExists);
  console.log('Current user ID:', user.id);
  console.log('All members before adding current user:', allMembers);
  
  if (!currentUserExists) {
    // Fetch current user data
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('Current user data:', currentUser);
    console.log('Current user error:', currentUserError);
    
    if (currentUser) {
      const currentUserMember = {
        id: `temp-${user.id}`,
        group_id: id,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        user: currentUser
      };
      allMembers.unshift(currentUserMember);
      console.log('Added current user to members:', currentUserMember);
      console.log('Current user name:', currentUser.name);
      console.log('Current user email:', currentUser.email);
    } else {
      console.error('Current user data not found!');
    }
  }
  
  console.log('Final allMembers:', allMembers);

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
      <GroupHeader group={group} members={allMembers} currentUserId={user.id} />

      <Tabs defaultValue="expenses" className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          <AddExpenseForm 
            groupId={id} 
            members={allMembers} 
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

