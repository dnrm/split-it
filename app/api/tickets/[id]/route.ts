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
      console.log('No user found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;
    console.log('Fetching ticket with ID:', ticketId);
    console.log('User ID:', user.id);

    // Validate ticket ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticketId)) {
      console.log('Invalid ticket ID format:', ticketId);
      return NextResponse.json(
        { error: 'Invalid ticket ID format' },
        { status: 400 }
      );
    }

    // Fetch ticket with items
    const { data: ticket, error: ticketError } = await supabase
      .from('shared_tickets')
      .select(`
        *,
        items:ticket_items(*)
      `)
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
    console.log('Checking membership for group:', ticket.group_id, 'user:', user.id);
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', ticket.group_id)
      .eq('user_id', user.id)
      .single();

    console.log('Membership query result:', { membership, membershipError });

    if (membershipError || !membership) {
      console.log('User not a member of group:', ticket.group_id, 'Error:', membershipError);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch uploader information
    const { data: uploaderUser } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', ticket.uploaded_by)
      .single();

    // Calculate remaining quantities and add claim information for items
    if (ticket.items && ticket.items.length > 0) {
      // Fetch claims for all items
      const itemIds = ticket.items.map((item: any) => item.id);
      const { data: claims } = await supabase
        .from('ticket_item_claims')
        .select('*, user:users(id, name, email, avatar_url)')
        .in('item_id', itemIds);

      // Group claims by item_id
      const claimsByItem = new Map<string, any[]>();
      claims?.forEach((claim: any) => {
        if (!claimsByItem.has(claim.item_id)) {
          claimsByItem.set(claim.item_id, []);
        }
        claimsByItem.get(claim.item_id)?.push(claim);
      });

      // Add claims and calculate remaining quantities for each item
      ticket.items.forEach((item: any) => {
        const itemClaims = claimsByItem.get(item.id) || [];
        const totalClaimed = itemClaims.reduce(
          (sum: number, claim: any) => sum + (claim.quantity_claimed || 0),
          0
        );
        
        item.claims = itemClaims;
        item.total_claimed = totalClaimed;
        item.remaining_quantity = item.quantity - totalClaimed;
        item.is_fully_claimed = item.remaining_quantity <= 0;
      });
    }

    // Add uploader info to ticket
    const ticketWithUploader = {
      ...ticket,
      uploaded_by_user: uploaderUser
    };

    return NextResponse.json({ ticket: ticketWithUploader, success: true });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to fetch ticket', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}