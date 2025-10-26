import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnimatedGroupsPage } from '@/components/dashboard/animated-groups-page';

export default async function GroupsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's groups with member count and expense data
  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(
        id,
        user_id
      ),
      expenses(
        id,
        amount
      )
    `)
    .eq('group_members.user_id', user.id)
    .order('created_at', { ascending: false });

  // Calculate member counts
  const groupsWithCounts = await Promise.all(
    (groups || []).map(async (group) => {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      const totalSpent = group.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;

      return {
        ...group,
        memberCount: count || 0,
        expenseCount: group.expenses?.length || 0,
        totalSpent,
      };
    })
  );

  return <AnimatedGroupsPage groups={groupsWithCounts || []} />;
}

