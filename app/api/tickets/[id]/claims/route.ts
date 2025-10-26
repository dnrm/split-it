import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TicketClaimRequest, TicketClaimResponse, TicketClaimSummary } from '@/types';

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

    // Get claim summary using the database function
    const { data: claimSummary, error: summaryError } = await supabase
      .rpc('get_ticket_claim_summary', { p_ticket_id: ticketId });

    if (summaryError) {
      console.error('Error getting claim summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to get claim summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      claimSummary: claimSummary as TicketClaimSummary[],
    });

  } catch (error) {
    console.error('Error getting claims:', error);
    return NextResponse.json(
      { error: 'Failed to get claims' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Starting claim POST request');
    
    const supabase = await createClient();
    console.log('✅ Supabase client created');
    
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('👤 User auth result:', { hasUser: !!user, userId: user?.id });

    if (!user) {
      console.log('❌ No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;
    console.log('🎫 Ticket ID:', ticketId);
    
    let body;
    try {
      body = await request.json();
      console.log('🔍 Claim request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { itemId, quantityClaimed, customAmount }: TicketClaimRequest = body;

    console.log('🔍 Parsed data:', { 
      itemId, 
      quantityClaimed, 
      customAmount,
      itemIdType: typeof itemId,
      quantityType: typeof quantityClaimed,
      hasItemId: !!itemId,
      isQuantityValid: quantityClaimed !== undefined && quantityClaimed !== null && quantityClaimed >= 0
    });

    if (!itemId || quantityClaimed === undefined || quantityClaimed === null || quantityClaimed < 0) {
      console.log('❌ Validation failed:', { 
        hasItemId: !!itemId, 
        quantityClaimed, 
        isValidQuantity: quantityClaimed >= 0,
        itemId,
        customAmount
      });
      return NextResponse.json(
        { error: 'Invalid claim data', debug: { itemId, quantityClaimed, customAmount } },
        { status: 400 }
      );
    }

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

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('ticket_items')
      .select('*')
      .eq('id', itemId)
      .eq('ticket_id', ticketId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Get current claims for this item
    const { data: existingClaims, error: claimsError } = await supabase
      .from('ticket_item_claims')
      .select('quantity_claimed')
      .eq('item_id', itemId);

    if (claimsError) {
      console.error('Error getting existing claims:', claimsError);
      return NextResponse.json(
        { error: 'Failed to get existing claims' },
        { status: 500 }
      );
    }

    // Calculate remaining quantity
    const totalClaimed = existingClaims?.reduce(
      (sum, claim) => sum + claim.quantity_claimed,
      0
    ) || 0;
    const remainingQuantity = item.quantity - totalClaimed;

    // Check if user already has a claim on this item
    const { data: userClaim, error: userClaimError } = await supabase
      .from('ticket_item_claims')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .single();

    if (userClaimError && userClaimError.code !== 'PGRST116') {
      console.error('Error checking user claim:', userClaimError);
      return NextResponse.json(
        { error: 'Failed to check existing claim' },
        { status: 500 }
      );
    }

    // Handle case where quantityClaimed is 0 (remove claim)
    if (quantityClaimed === 0) {
      if (userClaim) {
        // Delete existing claim
        const { error: deleteError } = await supabase
          .from('ticket_item_claims')
          .delete()
          .eq('id', userClaim.id);

        if (deleteError) {
          console.error('Error deleting claim:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete claim' },
            { status: 500 }
          );
        }
      }

      const response: TicketClaimResponse = {
        success: true,
        message: 'Claim removed successfully',
        remainingQuantity: remainingQuantity + (userClaim?.quantity_claimed || 0),
      };

      return NextResponse.json(response);
    }

    // Validate claim quantity
    if (quantityClaimed > remainingQuantity) {
      const response: TicketClaimResponse = {
        success: false,
        message: `Cannot claim ${quantityClaimed} items. Only ${remainingQuantity} remaining.`,
        remainingQuantity,
      };
      return NextResponse.json(response, { status: 400 });
    }

    try {
      if (userClaim) {
        // Update existing claim
        const { error: updateError } = await supabase
          .from('ticket_item_claims')
          .update({
            quantity_claimed: quantityClaimed,
            custom_amount: customAmount,
          })
          .eq('id', userClaim.id);

        if (updateError) {
          console.error('Error updating claim:', updateError);
          return NextResponse.json(
            { error: 'Failed to update claim' },
            { status: 500 }
          );
        }
      } else {
        // Create new claim
        const { error: insertError } = await supabase
          .from('ticket_item_claims')
          .insert({
            item_id: itemId,
            user_id: user.id,
            quantity_claimed: quantityClaimed,
            custom_amount: customAmount,
          });

        if (insertError) {
          console.error('Error creating claim:', insertError);
          return NextResponse.json(
            { error: 'Failed to create claim' },
            { status: 500 }
          );
        }
      }

      // Calculate new remaining quantity
      const newRemainingQuantity = remainingQuantity - quantityClaimed + (userClaim?.quantity_claimed || 0);

      const response: TicketClaimResponse = {
        success: true,
        message: 'Claim updated successfully',
        remainingQuantity: newRemainingQuantity,
      };

      return NextResponse.json(response);

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to process claim' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Unexpected error in claim processing:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to process claim', 
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

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

    // Delete user's claim on this item
    const { error: deleteError } = await supabase
      .from('ticket_item_claims')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting claim:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Claim deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting claim:', error);
    return NextResponse.json(
      { error: 'Failed to delete claim' },
      { status: 500 }
    );
  }
}
