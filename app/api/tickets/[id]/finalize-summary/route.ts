import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TicketFinalizationSummary } from '@/types';

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

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('shared_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Get claim summary
    const { data: claimSummary, error: summaryError } = await supabase
      .rpc('get_ticket_claim_summary', { p_ticket_id: ticketId });

    if (summaryError) {
      console.error('Error getting claim summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to get claim summary' },
        { status: 500 }
      );
    }

    // Get group members
    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', ticket.group_id);

    // Calculate user totals
    const userTotals = [];
    for (const member of groupMembers || []) {
      const { data: userTotal } = await supabase
        .rpc('get_user_ticket_total', {
          p_ticket_id: ticketId,
          p_user_id: member.user_id,
        });

      if (userTotal && userTotal > 0) {
        userTotals.push({
          userId: member.user_id,
          userName: 'Unknown',
          total: userTotal,
          items: [], // Items will be populated by frontend if needed
        });
      }
    }

    // Get unclaimed items
    const unclaimedItems = claimSummary?.filter((item: any) => item.remaining_quantity > 0) || [];

    const summary: TicketFinalizationSummary = {
      ticketId,
      merchantName: ticket.merchant_name || 'Unknown Merchant',
      totalAmount: ticket.total_amount || 0,
      userTotals,
      unclaimedItems: unclaimedItems.map((item: any) => ({
        itemName: item.item_name,
        quantity: item.remaining_quantity,
        amount: item.remaining_quantity * item.item_price,
      })),
    };

    return NextResponse.json({ summary, success: true });

  } catch (error) {
    console.error('Error getting finalization summary:', error);
    return NextResponse.json(
      { error: 'Failed to get summary' },
      { status: 500 }
    );
  }
}
