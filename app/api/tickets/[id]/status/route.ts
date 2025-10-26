import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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
    const { status } = body;

    // Validate status
    const validStatuses = ['processing', 'ready', 'finalized', 'error'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: processing, ready, finalized, error' },
        { status: 400 }
      );
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('shared_tickets')
      .select('group_id, status')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
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
      return NextResponse.json(
        { error: 'You must be a member of this group to update ticket status' },
        { status: 403 }
      );
    }

    // Validate status transitions
    const currentStatus = ticket.status;
    const validTransitions: Record<string, string[]> = {
      'processing': ['ready', 'error'],
      'ready': ['finalized', 'error'],
      'finalized': [], // Finalized tickets cannot be changed
      'error': ['processing', 'ready'] // Can retry from error
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status transition from ${currentStatus} to ${status}`,
          validTransitions: validTransitions[currentStatus] || []
        },
        { status: 400 }
      );
    }

    // Update ticket status
    const { error: updateError } = await supabase
      .from('shared_tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update ticket status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Ticket status updated to ${status}`,
      status 
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
