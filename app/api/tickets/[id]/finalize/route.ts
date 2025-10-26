import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TicketFinalizationSummary } from '@/types';

export async function POST(
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
    const body = await request.json();
    const { handleUnclaimedItems } = body; // 'split_equally' | 'assign_to_uploader' | 'skip'

    // Get ticket details and verify access
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

    // Check if user has access to this ticket
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', ticket.group_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You do not have access to this ticket' },
        { status: 403 }
      );
    }

    // Check if ticket is ready for finalization
    if (ticket.status !== 'ready') {
      return NextResponse.json(
        { error: 'Ticket is not ready for finalization' },
        { status: 400 }
      );
    }

    // Get all group members
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', ticket.group_id);

    if (membersError || !groupMembers) {
      return NextResponse.json(
        { error: 'Failed to get group members' },
        { status: 500 }
      );
    }

    // Get user totals from claims
    const userTotals = new Map<string, { userId: string; userName: string; total: number; items: any[] }>();

    for (const member of groupMembers) {
      const { data: userTotal, error: totalError } = await supabase
        .rpc('get_user_ticket_total', {
          p_ticket_id: ticketId,
          p_user_id: member.user_id,
        });

      if (totalError) {
        console.error('Error getting user total:', totalError);
        continue;
      }

      if (userTotal > 0) {
        userTotals.set(member.user_id, {
          userId: member.user_id,
          userName: (member.user as any)?.name || 'Unknown',
          total: userTotal,
          items: [], // Will be populated below
        });
      }
    }

    // Get detailed claim information for each user
    const { data: claims, error: claimsError } = await supabase
      .from('ticket_item_claims')
      .select(`
        *,
        item:ticket_items(*)
      `)
      .eq('item.ticket_id', ticketId);

    if (claimsError) {
      console.error('Error getting claims:', claimsError);
      return NextResponse.json(
        { error: 'Failed to get claims' },
        { status: 500 }
      );
    }

    // Populate items for each user
    claims?.forEach(claim => {
      const userTotal = userTotals.get(claim.user_id);
      if (userTotal) {
        const amount = claim.custom_amount || (claim.quantity_claimed * claim.item.price);
        userTotal.items.push({
          itemName: claim.item.name,
          quantity: claim.quantity_claimed,
          amount: amount,
        });
      }
    });

    // Get unclaimed items
    const { data: unclaimedSummary, error: unclaimedError } = await supabase
      .rpc('get_ticket_claim_summary', { p_ticket_id: ticketId });

    if (unclaimedError) {
      console.error('Error getting unclaimed items:', unclaimedError);
      return NextResponse.json(
        { error: 'Failed to get unclaimed items' },
        { status: 500 }
      );
    }

    const unclaimedItems = unclaimedSummary?.filter((item: any) => item.remaining_quantity > 0) || [];

    // Handle unclaimed items based on user preference
    if (unclaimedItems.length > 0 && handleUnclaimedItems !== 'skip') {
      const unclaimedTotal = unclaimedItems.reduce(
        (sum: number, item: any) => sum + (item.remaining_quantity * item.item_price),
        0
      );

      if (handleUnclaimedItems === 'split_equally') {
        // Split unclaimed items equally among all group members
        const splitAmount = unclaimedTotal / groupMembers.length;
        groupMembers.forEach(member => {
          const userTotal = userTotals.get(member.user_id);
          if (userTotal) {
            userTotal.total += splitAmount;
            userTotal.items.push({
              itemName: 'Unclaimed items (split equally)',
              quantity: 1,
              amount: splitAmount,
            });
          } else {
            userTotals.set(member.user_id, {
              userId: member.user_id,
              userName: (member.user as any)?.name || 'Unknown',
              total: splitAmount,
              items: [{
                itemName: 'Unclaimed items (split equally)',
                quantity: 1,
                amount: splitAmount,
              }],
            });
          }
        });
      } else if (handleUnclaimedItems === 'assign_to_uploader') {
        // Assign unclaimed items to the uploader
        const uploaderTotal = userTotals.get(ticket.uploaded_by);
        if (uploaderTotal) {
          uploaderTotal.total += unclaimedTotal;
          uploaderTotal.items.push({
            itemName: 'Unclaimed items',
            quantity: 1,
            amount: unclaimedTotal,
          });
        } else {
          userTotals.set(ticket.uploaded_by, {
            userId: ticket.uploaded_by,
            userName: 'Unknown',
            total: unclaimedTotal,
            items: [{
              itemName: 'Unclaimed items',
              quantity: 1,
              amount: unclaimedTotal,
            }],
          });
        }
      }
    }

    // Create expenses for each user with claims
    const createdExpenses = [];
    const errors = [];

    for (const [userId, userTotal] of userTotals) {
      if (userTotal.total <= 0) continue;

      try {
        // Create expense
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .insert({
            group_id: ticket.group_id,
            payer_id: userId,
            amount: userTotal.total,
            description: `Ticket from ${ticket.merchant_name || 'Unknown Merchant'}`,
            category: 'other',
            raw_input: `Ticket items: ${userTotal.items.map(item => `${item.itemName} (${item.quantity}x)`).join(', ')}`,
          })
          .select()
          .single();

        if (expenseError) {
          console.error('Error creating expense:', expenseError);
          errors.push(`Failed to create expense for ${userTotal.userName}`);
          continue;
        }

        // Create expense split (user pays for themselves)
        const { error: splitError } = await supabase
          .from('expense_splits')
          .insert({
            expense_id: expense.id,
            user_id: userId,
            amount: userTotal.total,
          });

        if (splitError) {
          console.error('Error creating expense split:', splitError);
          errors.push(`Failed to create split for ${userTotal.userName}`);
          continue;
        }

        createdExpenses.push({
          userId,
          userName: userTotal.userName,
          amount: userTotal.total,
          expenseId: expense.id,
        });

      } catch (error) {
        console.error('Error processing user total:', error);
        errors.push(`Failed to process ${userTotal.userName}`);
      }
    }

    // Update ticket status to finalized
    const { error: updateError } = await supabase
      .from('shared_tickets')
      .update({ status: 'finalized' })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket status:', updateError);
      errors.push('Failed to update ticket status');
    }

    const summary: TicketFinalizationSummary = {
      ticketId,
      merchantName: ticket.merchant_name || 'Unknown Merchant',
      totalAmount: ticket.total_amount || 0,
      userTotals: Array.from(userTotals.values()),
      unclaimedItems: unclaimedItems.map((item: any) => ({
        itemName: item.item_name,
        quantity: item.remaining_quantity,
        amount: item.remaining_quantity * item.item_price,
      })),
    };

    return NextResponse.json({
      success: true,
      message: 'Ticket finalized successfully',
      summary,
      createdExpenses,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error finalizing ticket:', error);
    return NextResponse.json(
      { error: 'Failed to finalize ticket' },
      { status: 500 }
    );
  }
}
