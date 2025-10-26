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

    // Fetch all tickets from user's groups with items
    const { data: tickets, error: ticketsError } = await supabase
      .from('shared_tickets')
      .select(`
        *,
        items:ticket_items(*)
      `)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    // Fetch uploader information for all tickets
    const ticketsWithUploaders = await Promise.all(
      (tickets || []).map(async (ticket) => {
        const { data: uploaderUser } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .eq('id', ticket.uploaded_by)
          .single();

        return {
          ...ticket,
          uploaded_by_user: uploaderUser
        };
      })
    );

    return NextResponse.json({ tickets: ticketsWithUploaders, success: true });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
