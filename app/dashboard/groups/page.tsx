import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Receipt } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

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

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Manage your expense groups</p>
        </div>
        <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' asChild>
          <Link href="/dashboard/groups/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Link>
        </Button>
      </div>

      {/* Groups Grid */}
      {!groupsWithCounts || groupsWithCounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No groups yet</h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Create your first group to start tracking shared expenses with friends or family
            </p>
            <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary' asChild>
              <Link href="/dashboard/groups/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Group
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupsWithCounts.map((group) => (
            <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                  <CardDescription>Created {formatDate(group.created_at)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{group.memberCount}</span>
                      <span className="text-muted-foreground">
                        member{group.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{group.expenseCount}</span>
                      <span className="text-muted-foreground">
                        expense{group.expenseCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-bold">{formatCurrency(group.totalSpent, group.currency)}</p>
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

