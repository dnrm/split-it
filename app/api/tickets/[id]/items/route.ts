import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;
    console.log('Fetching items for ticket ID:', ticketId);

    // First check if user has access to this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('shared_tickets')
      .select('group_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.log('Ticket not found or error:', ticketError);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user has access (is member of the group)
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', ticket.group_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      console.log('User not a member of group:', ticket.group_id);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch items with claims (simplified query)
    const { data: items, error: itemsError } = await supabase
      .from('ticket_items')
      .select(`
        *,
        claims:ticket_item_claims(*)
      `)
      .eq('ticket_id', ticketId)
      .order('line_number', { ascending: true });

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      console.error('Items error details:', {
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint
      });
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      );
    }

    // Fetch user information for claims
    if (items && items.length > 0) {
      const claimUserIds = new Set<string>();
      items.forEach(item => {
        item.claims?.forEach(claim => {
          claimUserIds.add(claim.user_id);
        });
      });

      if (claimUserIds.size > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', Array.from(claimUserIds));

        if (!usersError && users) {
          const userMap = new Map(users.map(user => [user.id, user]));
          
          // Add user data to claims
          items.forEach(item => {
            item.claims?.forEach(claim => {
              claim.user = userMap.get(claim.user_id);
            });
          });
        }
      }
    }

    return NextResponse.json({ items: items || [], success: true });

  } catch (error) {
    console.error('Error fetching ticket items:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to fetch items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
