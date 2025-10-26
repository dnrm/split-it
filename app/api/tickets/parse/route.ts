import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseTicketFromImage } from '@/lib/ai/gemini-vision-parser';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

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

    // Check if ticket is in processing status
    if (ticket.status !== 'processing') {
      return NextResponse.json(
        { error: 'Ticket is not in processing status' },
        { status: 400 }
      );
    }

    try {
      // Download image from storage
      const imageUrl = ticket.image_url;
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error('Failed to download image');
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Parse the image with Gemini
      const parsedData = await parseTicketFromImage(imageBuffer, mimeType);

      // Simple critical checks - log warnings but don't block
      if (!parsedData.merchantName) {
        console.warn('No merchant name found');
      }
      if (parsedData.total <= 0) {
        console.warn('Total is zero or negative');
      }
      if (parsedData.items.length === 0) {
        console.warn('No items found in receipt');
      }

      // Always proceed - user can fix in UI

      // Update ticket with parsed data
      const { error: updateError } = await supabase
        .from('shared_tickets')
        .update({
          merchant_name: parsedData.merchantName,
          total_amount: parsedData.total,
          parsed_data: parsedData,
          status: 'ready',
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        return NextResponse.json(
          { error: 'Failed to update ticket' },
          { status: 500 }
        );
      }

      // Create ticket items
      const itemsToInsert = parsedData.items.map((item, index) => ({
        ticket_id: ticketId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category || 'other',
        line_number: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from('ticket_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating ticket items:', itemsError);
        
        // Rollback ticket status
        await supabase
          .from('shared_tickets')
          .update({ status: 'error' })
          .eq('id', ticketId);

        return NextResponse.json(
          { error: 'Failed to create ticket items' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Ticket parsed successfully',
        parsedData,
        confidence: parsedData.confidence,
      });

    } catch (parseError) {
      console.error('Error parsing ticket:', parseError);
      
      // Update ticket status to error
      await supabase
        .from('shared_tickets')
        .update({
          status: 'error',
          parsed_data: {
            error: 'Failed to parse ticket',
            message: parseError instanceof Error ? parseError.message : 'Unknown error',
          },
        })
        .eq('id', ticketId);

      return NextResponse.json(
        { error: 'Failed to parse ticket image' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in parse endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
