import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all groups user is a member of
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ tickets: [], success: true });
    }

    const groupIds = memberships.map(m => m.group_id);

    // Fetch all tickets from user's groups
    const { data: tickets, error: ticketsError } = await supabase
      .from('shared_tickets')
      .select('*')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: tickets || [], success: true });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
